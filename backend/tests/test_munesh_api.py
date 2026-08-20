"""Backend API tests for Munesh Properties."""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or "https://up-real-estate.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_USER = "Munesh2006"
ADMIN_PASS = "Aditya198@#"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(session):
    r = session.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Public endpoints ----------------
class TestPublic:
    def test_meta(self, session):
        r = session.get(f"{API}/meta")
        assert r.status_code == 200
        d = r.json()
        assert "plot" in d["property_types"] and "shop" in d["property_types"]
        assert "Khair" in d["locations"] and "Aligarh" in d["locations"]

    def test_list_properties(self, session):
        r = session.get(f"{API}/properties")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 1, "Expected seeded properties"
        item = arr[0]
        for key in ("id", "title", "property_type", "location", "price", "media"):
            assert key in item

    def test_filter_by_type(self, session):
        r = session.get(f"{API}/properties", params={"property_type": "plot"})
        assert r.status_code == 200
        for p in r.json():
            assert p["property_type"] == "plot"

    def test_filter_by_location(self, session):
        r = session.get(f"{API}/properties", params={"location": "Aligarh"})
        assert r.status_code == 200
        for p in r.json():
            assert p["location"] == "Aligarh"

    def test_search_q(self, session):
        r = session.get(f"{API}/properties", params={"q": "Khair"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_property_by_id(self, session):
        arr = session.get(f"{API}/properties").json()
        if not arr:
            pytest.skip("No seeded properties")
        pid = arr[0]["id"]
        r = session.get(f"{API}/properties/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_get_property_404(self, session):
        r = session.get(f"{API}/properties/does-not-exist")
        assert r.status_code == 404

    def test_contact(self, session):
        r = session.get(f"{API}/contact")
        assert r.status_code == 200
        d = r.json()
        for k in ("whatsapp", "telegram", "phone", "email", "address", "about"):
            assert k in d

    def test_create_enquiry(self, session):
        payload = {"name": "TEST_User", "phone": "9876543210", "email": "test@x.com", "message": "hello"}
        r = session.post(f"{API}/enquiries", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_User" and d["phone"] == "9876543210"
        assert "id" in d


# ---------------- Auth ----------------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200
        assert r.json()["token_type"] == "bearer"

    def test_login_wrong(self, session):
        r = session.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ---------------- Admin CRUD ----------------
class TestAdminProperties:
    created_id = None

    def test_admin_endpoints_require_auth(self, session):
        r = session.post(f"{API}/admin/properties", json={"title": "x", "property_type": "plot", "location": "Khair", "price": "1"})
        assert r.status_code == 401

    def test_create_property(self, session, auth_headers):
        payload = {
            "title": "TEST_Plot",
            "property_type": "plot",
            "location": "Khair",
            "price": "10 Lakh",
            "area": "100 sqyd",
            "description": "test",
            "amenities": ["Water"],
            "status": "available",
            "featured": False,
            "media": [],
        }
        r = session.post(f"{API}/admin/properties", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Plot"
        TestAdminProperties.created_id = d["id"]

        # verify persistence
        g = session.get(f"{API}/properties/{d['id']}")
        assert g.status_code == 200 and g.json()["title"] == "TEST_Plot"

    def test_update_property(self, session, auth_headers):
        pid = TestAdminProperties.created_id
        assert pid
        payload = {
            "title": "TEST_Plot_Updated",
            "property_type": "plot",
            "location": "Aligarh",
            "price": "12 Lakh",
            "area": "100",
            "description": "updated",
            "amenities": [],
            "status": "sold",
            "featured": True,
            "media": [],
        }
        r = session.put(f"{API}/admin/properties/{pid}", json=payload, headers=auth_headers)
        assert r.status_code == 200
        g = session.get(f"{API}/properties/{pid}").json()
        assert g["title"] == "TEST_Plot_Updated" and g["status"] == "sold" and g["location"] == "Aligarh"

    def test_delete_property(self, session, auth_headers):
        pid = TestAdminProperties.created_id
        r = session.delete(f"{API}/admin/properties/{pid}", headers=auth_headers)
        assert r.status_code == 200
        g = session.get(f"{API}/properties/{pid}")
        assert g.status_code == 404


class TestAdminContactAndEnquiries:
    def test_update_contact_requires_auth(self, session):
        r = session.put(f"{API}/admin/contact", json={"whatsapp": "1", "telegram": "1", "phone": "1", "email": "a@b.com", "address": "x", "about": "y"})
        assert r.status_code == 401

    def test_update_contact(self, session, auth_headers):
        # get current
        current = session.get(f"{API}/contact").json()
        new_body = {**current, "about": "TEST_ABOUT_UPDATE"}
        r = session.put(f"{API}/admin/contact", json=new_body, headers=auth_headers)
        assert r.status_code == 200
        g = session.get(f"{API}/contact").json()
        assert g["about"] == "TEST_ABOUT_UPDATE"
        # restore
        session.put(f"{API}/admin/contact", json=current, headers=auth_headers)

    def test_list_enquiries_requires_auth(self, session):
        r = session.get(f"{API}/admin/enquiries")
        assert r.status_code == 401

    def test_list_and_delete_enquiries(self, session, auth_headers):
        # create one
        e = session.post(f"{API}/enquiries", json={"name": "TEST_DEL", "phone": "9999999999"}).json()
        r = session.get(f"{API}/admin/enquiries", headers=auth_headers)
        assert r.status_code == 200
        assert any(x["id"] == e["id"] for x in r.json())
        d = session.delete(f"{API}/admin/enquiries/{e['id']}", headers=auth_headers)
        assert d.status_code == 200


# ---------------- Upload ----------------
class TestUpload:
    def test_upload_requires_auth(self, session):
        files = {"file": ("t.txt", io.BytesIO(b"hi"), "text/plain")}
        r = requests.post(f"{API}/admin/upload", files=files)
        assert r.status_code == 401

    def test_upload_image(self, session, token):
        # 1x1 PNG bytes
        png = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
        )
        files = {"file": ("t.png", io.BytesIO(png), "image/png")}
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API}/admin/upload", files=files, headers=headers, timeout=60)
        if r.status_code == 402:
            pytest.skip("Storage credits exhausted")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["type"] == "image" and d["path"] and d["url"].startswith("/api/files/")
        # public file serving
        fr = requests.get(f"{BASE_URL}{d['url']}", timeout=60)
        assert fr.status_code == 200
        assert len(fr.content) > 0
