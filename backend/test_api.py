import requests

BASE_URL = "http://127.0.0.1:8000"

ADMIN_LOGIN = "OIADHR240001"
ADMIN_PASSWORD = "admin123"

EMPLOYEE_LOGIN = "OIJODO240001"
EMPLOYEE_PASSWORD = "emp12345"


passed = 0
failed = 0


def test(name, condition, details=""):
    global passed, failed

    if condition:
        print(f"✅ {name}")
        passed += 1
    else:
        print(f"❌ {name} {details}")
        failed += 1


def login(login_id, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": login_id,
            "password": password,
            "grant_type": "password",
        },
    )

    if response.status_code != 200:
        return None

    return response.json()["access_token"]


print("\n========== DAYFLOW API TEST ==========\n")


# ---------------- AUTH ----------------

admin_token = login(ADMIN_LOGIN, ADMIN_PASSWORD)
employee_token = login(EMPLOYEE_LOGIN, EMPLOYEE_PASSWORD)

test("Admin Login", admin_token is not None)
test("Employee Login", employee_token is not None)

admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
employee_headers = {
    "Authorization": f"Bearer {employee_token}"
} if employee_token else {}


if employee_token:
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers=employee_headers,
    )

    test("Employee /auth/me", response.status_code == 200)


if admin_token:
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers=admin_headers,
    )

    test("Admin /auth/me", response.status_code == 200)


# ---------------- EMPLOYEES ----------------

if admin_token:
    response = requests.get(
        f"{BASE_URL}/employees",
        headers=admin_headers,
    )

    test("List Employees", response.status_code == 200)


# ---------------- ATTENDANCE ----------------

if employee_token:
    response = requests.get(
        f"{BASE_URL}/attendance/status",
        headers=employee_headers,
    )

    test("Attendance Status", response.status_code == 200)

    response = requests.get(
        f"{BASE_URL}/attendance/my-history",
        headers=employee_headers,
    )

    test("Attendance History", response.status_code == 200)

    response = requests.get(
        f"{BASE_URL}/attendance/my-summary",
        headers=employee_headers,
    )

    test("Attendance Summary", response.status_code == 200)


if admin_token:
    response = requests.get(
        f"{BASE_URL}/attendance/admin/all",
        headers=admin_headers,
    )

    test("Admin Attendance", response.status_code == 200)


# ---------------- TIME OFF ----------------

if employee_token:
    response = requests.get(
        f"{BASE_URL}/time-off/types",
        headers=employee_headers,
    )

    test("Time Off Types", response.status_code == 200)

    response = requests.get(
        f"{BASE_URL}/time-off/my-requests",
        headers=employee_headers,
    )

    test("My Leave Requests", response.status_code == 200)

    response = requests.get(
        f"{BASE_URL}/time-off/my-balances",
        headers=employee_headers,
    )

    test("My Leave Balances", response.status_code == 200)


if admin_token:
    response = requests.get(
        f"{BASE_URL}/time-off/admin/requests?page=1&page_size=20",
        headers=admin_headers,
    )

    test("Admin Leave Requests", response.status_code == 200)


# ---------------- SALARY ----------------

if employee_token:
    response = requests.get(
        f"{BASE_URL}/salary/my-salary",
        headers=employee_headers,
    )

    test("My Salary", response.status_code == 200)


if admin_token:
    response = requests.get(
        f"{BASE_URL}/salary/admin/2",
        headers=admin_headers,
    )

    test("Admin Employee Salary", response.status_code == 200)


# ---------------- NOTIFICATIONS ----------------

if employee_token:
    response = requests.get(
        f"{BASE_URL}/notifications",
        headers=employee_headers,
    )

    test("Notifications", response.status_code == 200)

    response = requests.get(
        f"{BASE_URL}/notifications/unread-count",
        headers=employee_headers,
    )

    test("Unread Notifications", response.status_code == 200)


# ---------------- PROFILE ----------------

if employee_token:
    response = requests.get(
        f"{BASE_URL}/profile",
        headers=employee_headers,
    )

    test("Employee Profile", response.status_code == 200)


# ---------------- HEALTH ----------------

response = requests.get(f"{BASE_URL}/health")

test("Health Check", response.status_code == 200)


# ---------------- RESULT ----------------

print("\n======================================")
print(f"PASSED: {passed}")
print(f"FAILED: {failed}")
print("======================================")

if failed == 0:
    print("\n🎉 ALL API TESTS PASSED!")
else:
    print("\n⚠️ SOME TESTS FAILED")