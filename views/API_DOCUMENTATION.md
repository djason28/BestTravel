# Backend API Documentation for Best Travel Agency

This document describes all the API endpoints that the frontend expects from the Golang backend.

## Base URL
All API endpoints should be served from `/api` path (e.g., `https://yourdomain.com/api`)

## Authentication
- Use JWT tokens for authentication
- Token should be passed in the `Authorization` header as `Bearer <token>`
- Token is stored in localStorage on the frontend with key `auth_token`

---

## Endpoints

### Authentication

#### POST `/api/auth/login`
Login with email and password

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/auth/logout`
Logout current user

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true
}
```

#### GET `/api/auth/me`
Get current authenticated user

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "admin@example.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

#### POST `/api/auth/refresh`
Refresh authentication token

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "token": "new_jwt_token_here"
}
```

---

### Packages

#### GET `/api/packages`
Get all packages with optional filters

**Query Parameters:**
- `search` (string): Search packages by title or description
- `category` (string): Filter by category
- `destination` (string): Filter by destination
- `difficulty` (string): Filter by difficulty (easy, moderate, challenging)
- `sortBy` (string): Sort by (newest, popular, price_asc, price_desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-1",
      "title": "Bali Paradise Tour",
      "slug": "bali-paradise-tour",
      "description": "Full description...",
      "shortDescription": "Short description...",
      "price": 5000000,
      "currency": "IDR",
      "duration": 5,
      "durationUnit": "days",
      "category": "beach",
      "destination": "Bali",
      "images": [
        {
          "id": "img-1",
          "url": "https://example.com/image.jpg",
          "alt": "Image description",
          "order": 1,
          "isCover": true
        }
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival Day",
          "description": "Description...",
          "activities": ["Activity 1", "Activity 2"],
          "meals": ["Breakfast", "Lunch"],
          "accommodation": "Hotel Name"
        }
      ],
      "included": ["Item 1", "Item 2"],
      "excluded": ["Item 1", "Item 2"],
      "highlights": ["Highlight 1", "Highlight 2"],
      "availability": "Year-round",
      "maxParticipants": 15,
      "difficulty": "easy",
      "featured": true,
      "status": "published",
      "viewCount": 150,
      "inquiryCount": 10,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

#### GET `/api/packages/:id`
Get package by ID

**Response (200):**
```json
{
  "success": true,
  "data": { /* Package object */ }
}
```

#### GET `/api/packages/slug/:slug`
Get package by slug

**Response (200):**
```json
{
  "success": true,
  "data": { /* Package object */ }
}
```

#### POST `/api/packages`
Create new package (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Package object without id, viewCount, inquiryCount, createdAt, updatedAt)

**Response (201):**
```json
{
  "success": true,
  "data": { /* Created package object */ }
}
```

#### PUT `/api/packages/:id`
Update package (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (Partial package object)

**Response (200):**
```json
{
  "success": true,
  "data": { /* Updated package object */ }
}
```

#### DELETE `/api/packages/:id`
Delete package (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true
}
```

#### POST `/api/packages/:id/view`
Increment view count for a package

**Response (200):**
```json
{
  "success": true
}
```

---

### Inquiries

#### GET `/api/inquiries`
Get all inquiries (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by status (new, contacted, converted, closed)
- `page` (number): Page number
- `limit` (number): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inq-1",
      "packageId": "pkg-1",
      "packageTitle": "Bali Paradise Tour",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+62812345678",
      "message": "I'm interested in this package...",
      "participants": 2,
      "preferredDate": "2024-06-15",
      "status": "new",
      "source": "whatsapp",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### POST `/api/inquiries`
Create new inquiry

**Request Body:**
```json
{
  "packageId": "pkg-1",
  "packageTitle": "Bali Paradise Tour",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+62812345678",
  "message": "I'm interested...",
  "participants": 2,
  "preferredDate": "2024-06-15",
  "source": "form"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { /* Created inquiry object */ }
}
```

#### PATCH `/api/inquiries/:id/status`
Update inquiry status (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "contacted"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* Updated inquiry object */ }
}
```

---

### Dashboard

#### GET `/api/dashboard/stats`
Get dashboard statistics (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPackages": 50,
    "publishedPackages": 45,
    "draftPackages": 5,
    "totalInquiries": 100,
    "newInquiries": 10,
    "convertedInquiries": 20,
    "totalViews": 5000,
    "conversionRate": 20.5
  }
}
```

---

### Contact

#### POST `/api/contact`
Send contact form message

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+62812345678",
  "subject": "Inquiry about services",
  "message": "I would like to know more..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

---

### Upload

#### POST `/api/upload/image`
Upload image file (Admin only)

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: Image file
- `folder`: Target folder (e.g., "packages")

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://yourdomain.com/uploads/packages/image.jpg"
  }
}
```

#### DELETE `/api/upload/image`
Delete image file (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "url": "https://yourdomain.com/uploads/packages/image.jpg"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Error Responses

All error responses should follow this format:

**Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Security Requirements

1. **Authentication**: Use JWT tokens with appropriate expiry
2. **Input Validation**: Validate and sanitize all inputs on backend
3. **CORS**: Configure CORS to allow requests from your frontend domain
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **SQL Injection**: Use parameterized queries
6. **XSS Prevention**: Sanitize user inputs before storing
7. **File Upload**: Validate file types and sizes for image uploads
8. **HTTPS**: Always use HTTPS in production

---

## Notes for Frontend Integration

- All date/time values should be in ISO 8601 format
- The frontend expects `/api` as the base URL by default
- You can change this by setting `VITE_API_URL` environment variable
- All monetary values are in the smallest currency unit (e.g., cents for USD, rupiah for IDR)
- Image URLs should be absolute URLs that are publicly accessible
- The frontend handles token storage and automatically includes it in authenticated requests
