# AI Assistant UI - Login Feature Skill

This skill defines the architectural guidelines and high-security standards for implementing the Login feature across both the frontend (UI) and backend services.

## General Context
- **Frontend**: `d:\proj\ai-assistant-ui`
- **Backend**: `D:\proj\ai-chatbot\src` (As referenced in general.md)

## High Security & Architecture Requirements

1. **Secure Authentication Flow (JWT/Sessions)**:
   - **Backend**: Issue secure JSON Web Tokens (JWT) or session identifiers upon successful authentication. 
   - Use a short-lived **Access Token** and a longer-lived **Refresh Token**.
   - **Frontend Storage**: Never store sensitive tokens in `localStorage`. Store the Refresh Token in an **HttpOnly, Secure, SameSite=Strict cookie** to protect against Cross-Site Scripting (XSS) attacks. Keep the Access Token in application memory.

2. **Password Cryptography (Backend)**:
   - Passwords must be hashed using a strong, industry-standard algorithm like **bcrypt** or **Argon2** with a unique salt per user. 
   - Never log or store plain-text passwords.

3. **Protection Against Brute Force & Enumeration**:
   - **Rate Limiting**: The backend must strictly rate-limit the `/login` endpoint to prevent brute-force and dictionary attacks.
   - **Generic Errors**: The backend should return generic error messages (e.g., "Invalid email or password") rather than specifying whether the email exists, preventing user enumeration.
   - **Account Lockout**: Implement temporary account lockouts after consecutive failed attempts.

4. **Data in Transit**:
   - All authentication traffic between the frontend and backend must be encrypted using **HTTPS** (TLS).

5. **Cross-Site Request Forgery (CSRF) Prevention**:
   - If relying on cookies for the refresh token, implement Anti-CSRF tokens or strictly validate the `Origin` and `Referer` headers on the backend.

6. **Frontend UI/UX Implementation**:
   - Develop a responsive login interface that supports the project's theming (Light/Dark) and RTL layout (Arabic default).
   - Implement thorough client-side validation to improve user experience before data is sent to the server.
   - Gracefully handle loading states and display secure, non-specific error messages to the user upon failure.

7. **Social / OAuth Integrations (Future-proofing)**:
   - Given the project's social network connectivity goals, architect the login system to seamlessly support OAuth 2.0 providers (Google, Facebook, etc.) in the future using secure state parameters and PKCE (Proof Key for Code Exchange) where applicable.
