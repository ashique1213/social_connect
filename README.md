# SocialConnect

SocialConnect is a full-stack social media platform built with a **Django REST Framework** backend and a **React** frontend, styled with **Tailwind CSS**. It allows users to register, verify their email, manage profiles with privacy settings (`public`, `private`, `followers_only`), create/edit posts, interact via likes/comments/follows, view a paginated feed, and receive notifications for interactions. Admins can manage users through a dedicated dashboard. The platform emphasizes security, user privacy, and a seamless user experience.

## For Testing

For deployed One:

- **Admin User**  
  - User: `Admin`  
  - Pass: `Admin@123`  

- **Test User**  
  - User: `napos`  
  - Pass: `Admin@123`  

## Features

- **User Authentication**:
  - Register with username, email, and password; requires email verification.
  - Login via username or email, redirects to `/feed`.
  - Password management: reset, confirm reset, and change password.
- **Profile Management**:
  - Update profile (bio, website, location, avatar, privacy setting).
  - Privacy settings: `public` (visible to all), `private` (owner-only), `followers_only` (owner and followers).
  - Follow/unfollow other users.
- **Posts**:
  - Create posts with text (≤280 characters), category (`general`, `announcement`, `question`), and optional image (JPEG/PNG, ≤2MB).
  - Edit/delete posts (owner or admin only).
  - Like and comment on posts, with counts displayed.
- **Feed**:
  - Paginated feed (20 posts/page) showing accessible posts (own, public, followers-only from followed users).
- **Admin Dashboard**:
  - Admins (`is_staff=True`) can view all users, toggle `is_active` status, and view user details in a modal.
- **Notifications**:
  - Receive notifications for follows, likes, and comments.
  - Mark individual or all notifications as read.
  - Notifications respect profile privacy settings.

## Tech Stack

- **Backend**: Django 4.x, Django REST Framework, `djangorestframework-simplejwt`, PostgreSQL/SQLite
- **Frontend**: React 18.x, React Router, Axios, Tailwind CSS
- **Authentication**: JWT with refresh tokens
- **Email**: Configurable for console (testing) or SMTP (production)
- **Deployment**: Vercel and Render

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional; SQLite used by default)
- Git

### Backend Setup
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd socialconnect/socialconnect_server
   ```

2. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
   ```

4. **Configure Environment**:
   - Update `socialconnect_server/settings.py`:
     ```python
     DATABASES = {
         'default': {
             'ENGINE': 'django.db.backends.sqlite3',
             'NAME': BASE_DIR / 'db.sqlite3',
         }
     }
     CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
     EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # For testing
     # For production email:
     # EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
     # EMAIL_HOST = 'smtp.gmail.com'
     # EMAIL_PORT = 587
     # EMAIL_USE_TLS = True
     # EMAIL_HOST_USER = 'your-email@gmail.com'
     # EMAIL_HOST_PASSWORD = 'your-app-password'
     DEFAULT_FROM_EMAIL = 'your-email@gmail.com'
     FRONTEND_URL = 'http://localhost:5173'
     BASE_URL = 'http://localhost:8000'
     ```

5. **Run Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create Default Users**:
   - Run the custom management command to create admin and test users:
     ```bash
     python manage.py setup_users
     ```
   - This creates:
     - Admin user: `username: Admin, password: Admin@123` (staff and superuser)
     - Test user: `username: napos, password: Admin@123`

7. **Run Server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. **Navigate to Frontend**:
   ```bash
   cd ../
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Frontend**:
   - Open `http://localhost:5173` in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register a new user (username, email, password)
- `POST /api/auth/login/` - Login (returns JWT tokens; accepts username or email)
- `POST /api/auth/logout/` - Logout (invalidate session)
- `POST /api/auth/verify/` - Verify email (expects uidb64, token)
- `POST /api/auth/password-reset/` - Request password reset (sends email with link)
- `POST /api/auth/password-reset-confirm/` - Confirm password reset (sets new password)
- `POST /api/auth/change-password/` - Change password (requires old/new password, authentication)

### Users
- `GET /api/users/me/` - Get authenticated user's profile
- `PATCH /api/users/me/` - Update authenticated user's profile (bio, website, location, avatar, privacy)
- `GET /api/users/<pk>/` - Get user profile by ID (respects privacy settings)
- `POST /api/users/<pk>/follow/` - Follow a user
- `DELETE /api/users/<pk>/unfollow/` - Unfollow a user
- `GET /api/users/<pk>/followers/` - List user's followers
- `GET /api/users/<pk>/following/` - List users followed by the user

### Posts
- `POST /api/posts/` - Create a post (content, category, optional image)
- `GET /api/posts/<pk>/` - Get post by ID
- `PATCH /api/posts/<pk>/` - Update post (content, category, image; owner/admin only)
- `DELETE /api/posts/<pk>/` - Delete post (owner/admin only)
- `GET /api/posts/?page=<page>` - List posts (filtered by privacy)
- `POST /api/posts/<pk>/like/` - Like a post
- `DELETE /api/posts/<pk>/unlike/` - Unlike a post
- `GET /api/posts/<pk>/like-status/` - Check if user liked a post
- `POST /api/posts/<pk>/comments/` - Add a comment to a post
- `GET /api/posts/<pk>/comments/` - List comments for a post
- `DELETE /api/comments/<pk>/` - Delete a comment

### Feed
- `GET /api/feed/?page=<page>` - Get paginated feed (own, public, followers-only posts)

### Notifications
- `GET /api/notifications/` - List user notifications
- `POST /api/notifications/<pk>/read/` - Mark a notification as read
- `POST /api/notifications/mark-all-read/` - Mark all notifications as read

### Admin
- `GET /api/admin/users/` - List all users (admin only)
- `GET /api/admin/users/<pk>/` - Get user details (admin only)
- `POST /api/admin/users/<pk>/deactivate/` - Deactivate a user (admin only)
- `POST /api/admin/users/<pk>/activate/` - Activate a user (admin only)
- `GET /api/admin/posts/` - List all posts (admin only)
- `DELETE /api/admin/posts/<pk>/` - Delete a post (admin only)
- `GET /api/admin/stats/` - Get platform statistics (admin only)

## Usage

1. **Register**:
   - Go to `/register`, enter username, email, password.
   - Check email (or console for testing) for verification link.
   - Click link to activate account, redirect to `/login?verified=true`.

2. **Login**:
   - Go to `/login`, enter username/email and password, redirect to `/feed`.
   - Use default users:
     - Admin: `username: Admin, password: Admin@123`
     - Test user: `username: napos, password: Admin@123`

3. **Profile**:
   - Visit `/profile/me` to view/edit your profile (bio, website, location, privacy, avatar).
   - Set privacy to `public`, `private`, or `followers_only`.
   - View others’ profiles at `/profile/<userId>` (subject to privacy).

4. **Posts**:
   - Create posts in `/profile/me` (text ≤280, category, optional image ≤2MB).
   - Edit/delete your posts in `PostCard` components.
   - Like/comment on accessible posts.

5. **Feed**:
   - View `/feed` for paginated posts (own, public, followers-only from followed users).
   - Use Next/Previous buttons for pagination.

6. **Notifications**:
   - Visit `/notifications` to view notifications (follows, likes, comments).
   - Mark individual or all notifications as read.

7. **Admin Dashboard**:
   - Log in as `Admin`, visit `/admin` to toggle user `is_active` or view details.

8. **Password Management**:
   - Request reset at `/reset-password`, check email for link.
   - Set new password at `/reset/<uidb64>/<token>`.
   - Change password at `/change-password` (authenticated).

## License

MIT License