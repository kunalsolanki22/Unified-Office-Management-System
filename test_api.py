import requests

login_url = "http://localhost:8000/api/v1/auth/login"
data = {
    "email": "parking.manager@cygnet.com", 
    "password": "Manager@123"
}

try:
    print("Logging in as cygnet manager...")
    resp = requests.post(login_url, json=data)
    if resp.status_code != 200:
        print("Failed, trying company manager...")
        data["email"] = "parking.manager@company.com"
        resp = requests.post(login_url, json=data)
        
    if resp.status_code == 200:
        token = resp.json()["data"]["access_token"]
        print("Got token")
        
        change_url = "http://localhost:8000/api/v1/parking/slots/change-status/PKG-7803?new_status=AVAILABLE"
        headers = {"Authorization": f"Bearer {token}"}
        print("Changing status...")
        resp2 = requests.post(change_url, headers=headers)
        print("Status code:", resp2.status_code)
        print("Response:", resp2.json())
    else:
        print("Login failed:", resp.status_code, resp.text)
except Exception as e:
    print(e)
