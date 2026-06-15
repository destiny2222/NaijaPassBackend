# OpenContracting API Documentation

This document lists all available API endpoints, request bodies, headers, and responses for the **OpenContracting** platform. Use this guide to configure Postman, fetch endpoints, or build your frontend pages.

---

## Base Configuration
* **Local Server URL:** `http://localhost:3000`
* **Content-Type:** `application/json`
* **Authorization Header:** `Bearer <JWT_TOKEN>` (for authenticated endpoints)

---

## Table of Contents
1. [Authentication (`/api/auth`)](#1-authentication-apiauth)
2. [KYC & Onboarding (`/api/kyc`)](#2-kyc--onboarding-apikyc)
3. [Bids & Tenders (`/api/bids`)](#3-bids--tenders-apibids)
4. [Analytics Dashboard (`/api/analytics`)](#4-analytics-dashboard-apianalytics)
5. [Scraper Engine (`/api/scraper`)](#5-scraper-engine-apiscraper)

---

## 1. Authentication (`/api/auth`)

### Register User
Create a new account. The `role` can be `'user'` or `'admin'`.
* **Method:** `POST`
* **Route:** `/api/auth/register`
* **Request Body:**
  ```json
  {
    "name": "Destiny Contractor",
    "email": "destiny@example.com",
    "password": "securepassword123",
    "role": "user" 
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
      "name": "Destiny Contractor",
      "email": "destiny@example.com",
      "role": "user"
    }
  }
  ```

---

### Login User
Authenticate using email and password to receive a JWT token.
* **Method:** `POST`
* **Route:** `/api/auth/login`
* **Request Body:**
  ```json
  {
    "email": "destiny@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
      "name": "Destiny Contractor",
      "email": "destiny@example.com",
      "role": "user"
    }
  }
  ```

---

### Mock Google Login Redirect
Retrieve the Google OAuth redirect URL.
* **Method:** `GET`
* **Route:** `/api/auth/google`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Redirecting user to Google Login Page",
    "url": "http://localhost:3000/api/auth/google/callback?code=mock_google_auth_code_9921"
  }
  ```

---

### Mock Google OAuth Callback
Simulates receiving authorization code from Google to log in or register a Google user automatically.
* **Method:** `GET`
* **Route:** `/api/auth/google/callback`
* **Query Parameters:** `code=mock_google_auth_code_9921`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Google login successful",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "9921b2a9-7c8a-4d2d-9eb5-8e39268f7600",
      "name": "Google Contractor",
      "email": "googleuser@example.com",
      "role": "user"
    }
  }
  ```

---

## 2. KYC & Onboarding (`/api/kyc`)

### Get Industry Categories
Fetch all available industry categories for KYC submission.
* **Method:** `GET`
* **Route:** `/api/kyc/categories`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Construction & Infrastructure"
      },
      {
        "id": 2,
        "name": "Information Technology"
      }
    ]
  }
  ```

---

### Add Industry Category (Admin Only)
* **Method:** `POST`
* **Route:** `/api/kyc/categories`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "name": "Health & Medical Supply"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Industry category added successfully"
  }
  ```

---

### Submit KYC Onboarding Form
Submit contractor information for compliance checks. The KYC status initializes as `pending`.
* **Method:** `POST`
* **Route:** `/api/kyc/submit`
* **Headers:** `Authorization: Bearer <USER_JWT_TOKEN>`
* **Request Body (Business Type example):**
  ```json
  {
    "type": "business",
    "email": "info@gritinai.com",
    "phoneNumber": "+2348012345678",
    "businessName": "Gritinai Solutions Ltd",
    "registrationNumber": "RC-1299388",
    "taxIdentificationNumber": "TIN-00998822-0001",
    "industryCategoryId": 2
  }
  ```
* **Request Body (Individual Type example):**
  ```json
  {
    "type": "individual",
    "email": "john.doe@example.com",
    "phoneNumber": "+2348087654321"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "KYC form submitted successfully",
    "data": {
      "id": "49bf5d70-ef1d-4074-a63e-72bc58a0e23e",
      "userId": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
      "type": "business",
      "status": "pending"
    }
  }
  ```

---

### Add KYC Representatives (Business Accounts Only)
Add partners, directors, or representatives to your business KYC profile.
* **Method:** `POST`
* **Route:** `/api/kyc/representatives`
* **Headers:** `Authorization: Bearer <USER_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "kycId": "49bf5d70-ef1d-4074-a63e-72bc58a0e23e",
    "representatives": [
      {
        "name": "Alice Green",
        "position": "Chief Executive Officer"
      },
      {
        "name": "Bob Smith",
        "position": "Director of Operations"
      }
    ]
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "2 representative(s) added successfully"
  }
  ```

---

### Get My KYC Onboarding Status
Fetch the current contractor's KYC file and representatives.
* **Method:** `GET`
* **Route:** `/api/kyc/my`
* **Headers:** `Authorization: Bearer <USER_JWT_TOKEN>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "49bf5d70-ef1d-4074-a63e-72bc58a0e23e",
      "userId": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
      "type": "business",
      "status": "pending",
      "email": "info@gritinai.com",
      "phoneNumber": "+2348012345678",
      "businessName": "Gritinai Solutions Ltd",
      "registrationNumber": "RC-1299388",
      "taxIdentificationNumber": "TIN-00998822-0001",
      "rejectionReason": null,
      "industryCategoryId": 2,
      "industryCategory": {
        "id": 2,
        "name": "Information Technology"
      },
      "representatives": [
        {
          "id": 1,
          "name": "Alice Green",
          "position": "Chief Executive Officer"
        }
      ]
    }
  }
  ```

---

### List All KYCs (Admin Only)
Retrieve all KYC submissions in the platform. Supports filtering by status: `pending`, `inprogress`, `approved`, `rejected`.
* **Method:** `GET`
* **Route:** `/api/kyc/all`
* **Query Parameters:** `?status=pending`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "49bf5d70-ef1d-4074-a63e-72bc58a0e23e",
        "userId": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
        "type": "business",
        "status": "pending",
        "email": "info@gritinai.com",
        "user": {
          "id": "2781b2a9-7c8a-4d2d-9eb5-8e39268f763f",
          "name": "Destiny Contractor",
          "email": "destiny@example.com",
          "role": "user"
        },
        "industryCategory": {
          "id": 2,
          "name": "Information Technology"
        },
        "representatives": []
      }
    ]
  }
  ```

---

### Review KYC Submission (Admin Only)
Review contractor onboarding and change status to `inprogress`, `approved`, or `rejected`. If rejecting, a `rejectionReason` is required.
* **Method:** `PUT`
* **Route:** `/api/kyc/review/:id`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body (Approval example):**
  ```json
  {
    "status": "approved"
  }
  ```
* **Request Body (Rejection example):**
  ```json
  {
    "status": "rejected",
    "rejectionReason": "Uploaded document registration number is expired or invalid."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "KYC submission updated successfully to status: rejected",
    "data": {
      "id": "49bf5d70-ef1d-4074-a63e-72bc58a0e23e",
      "status": "rejected",
      "rejectionReason": "Uploaded document registration number is expired or invalid."
    }
  }
  ```

---

## 3. Bids & Tenders (`/api/bids`)

### Get Bid Categories
* **Method:** `GET`
* **Route:** `/api/bids/categories`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Construction & Public Works"
      },
      {
        "id": 2,
        "name": "ICT & Telecom Services"
      }
    ]
  }
  ```

---

### Add Bid Category (Admin Only)
* **Method:** `POST`
* **Route:** `/api/bids/categories`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "name": "Healthcare & Equipment"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Bid category added successfully"
  }
  ```

---

### Create Bid (Admin Only)
Publish a new bidding opportunity.
* **Method:** `POST`
* **Route:** `/api/bids`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "title": "Dualization of Lagos-Ibadan Expressway Sector III",
    "bidNumber": "BID-2026-FMWH-0089",
    "deadline": "2026-08-30T17:00:00.000Z",
    "agency": "Federal Ministry of Works & Housing",
    "categoryId": 1
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Bid created successfully",
    "data": {
      "id": "ea8b1a8d-19cd-4869-90bc-9e58319fbb1c",
      "title": "Dualization of Lagos-Ibadan Expressway Sector III",
      "bidNumber": "BID-2026-FMWH-0089",
      "deadline": "2026-08-30T17:00:00.000Z",
      "agency": "Federal Ministry of Works & Housing",
      "categoryId": 1
    }
  }
  ```

---

### List Bids & Tenders
Fetch published bids. Supports filters for category, status (active vs closed), and fuzzy search.
* **Method:** `GET`
* **Route:** `/api/bids`
* **Query Parameters:** `?categoryId=1&status=active&search=Lagos` (All parameters optional)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "ea8b1a8d-19cd-4869-90bc-9e58319fbb1c",
        "title": "Dualization of Lagos-Ibadan Expressway Sector III",
        "bidNumber": "BID-2026-FMWH-0089",
        "deadline": "2026-08-30T17:00:00.000Z",
        "agency": "Federal Ministry of Works & Housing",
        "categoryId": 1,
        "category": {
          "id": 1,
          "name": "Construction & Public Works"
        },
        "daysRemaining": 78,
        "status": "active"
      }
    ]
  }
  ```

---

### Get Bid Details
Retrieve details of a single bid.
* **Method:** `GET`
* **Route:** `/api/bids/:id`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "ea8b1a8d-19cd-4869-90bc-9e58319fbb1c",
      "title": "Dualization of Lagos-Ibadan Expressway Sector III",
      "bidNumber": "BID-2026-FMWH-0089",
      "deadline": "2026-08-30T17:00:00.000Z",
      "agency": "Federal Ministry of Works & Housing",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Construction & Public Works"
      },
      "daysRemaining": 78,
      "status": "active"
    }
  }
  ```

---

## 4. Analytics Dashboard (`/api/analytics`)

### Get Dashboard Analytics
Retrieve summaries and chart distributions to build UI graphs (e.g. active bids ratios, KYC compliance rates, categories count).
* **Method:** `GET`
* **Route:** `/api/analytics`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "bidsSummary": {
        "total": 5,
        "active": 4,
        "closed": 1
      },
      "kycSummary": {
        "total": 3,
        "pending": 1,
        "inprogress": 1,
        "approved": 1,
        "rejected": 0
      },
      "bidsByCategory": [
        {
          "categoryId": 1,
          "categoryName": "Construction & Public Works",
          "count": 3
        },
        {
          "categoryId": 2,
          "categoryName": "ICT & Telecom Services",
          "count": 2
        }
      ],
      "kycsByIndustry": [
        {
          "categoryId": 1,
          "categoryName": "Construction & Infrastructure",
          "count": 1
        },
        {
          "categoryId": 2,
          "categoryName": "Information Technology",
          "count": 2
        }
      ]
    }
  }
  ```

---

## 5. Scraper Engine (`/api/scraper`)

### Trigger Scraper simulation (Admin Only)
Provide a target URL and a list item CSS selector. The scraper simulates network retrieval and parses new bid listings.
* **Method:** `POST`
* **Route:** `/api/scraper/run`
* **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "url": "https://tenders.gov.ng/active-listings",
    "selector": ".tender-list-item"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Scrape completed successfully for https://tenders.gov.ng/active-listings",
    "meta": {
      "targetUrl": "https://tenders.gov.ng/active-listings",
      "selectorUsed": ".tender-list-item",
      "timestamp": "2026-06-12T22:30:15.000Z",
      "itemsFound": 3
    },
    "data": [
      {
        "title": "Construction of Multi-Purpose Community Hall",
        "bidNumber": "BID-342890",
        "agency": "Ministry of Works & Housing",
        "deadline": "2026-07-12"
      },
      {
        "title": "Supply and Installation of Cloud ERP Systems",
        "bidNumber": "BID-891004",
        "agency": "National Information Technology Development Agency (NITDA)",
        "deadline": "2026-06-27"
      },
      {
        "title": "Rehabilitation of Local Health Care Centers",
        "bidNumber": "BID-562911",
        "agency": "Primary Health Care Development Board",
        "deadline": "2026-07-27"
      }
    ]
  }
  ```
