# Crackers Admin API Bruno Workspace

This workspace lets the team run the backend APIs in Bruno without rebuilding headers and bodies each time.

## How to use

1. Open the `bruno/` folder as a collection in Bruno.
2. Select the `local` environment from `environments/local.bru`.
3. Run `Auth/01-login.bru`.
4. Copy the returned JWT token into `authToken` in the active environment.
5. Run admin write requests that need `Authorization: Bearer {{authToken}}`.

## Route conventions

- `{{baseUrl}}` points to `http://localhost:5000/api`.
- `/api/...` is the main backend route namespace.
- `/api/Get...` is the API-key protected public mirror used for public read flows.
- Public mirror requests in this workspace already include `x-api-key: {{apiKey}}`.

## File upload requests

These requests use `multipart/form-data` and the file field names must match the backend:

- Products: `image`
- Banners: `image`
- Store config: `off_banner_image`
- Brands: `logo`

If Bruno opens a multipart request with a placeholder path, replace it with an actual local file before sending.

## Notes

- The backend source of truth is `adminnode/routes/*`.
- Store config upload uses `off_banner_image`, not `invoice_logo`.
- Brand upload uses `logo`, not `brand_logo`.
