# Customer asset register and repair request linking

## What will be built
- Add a private **My Assets** page where signed-in customers can register, view, edit, and remove their appliances or equipment.
- Store each asset against the signed-in customer, including its name, repair category, brand, model, serial number, purchase date, and optional notes.
- Add **My Assets** access from the dashboard.
- Require customers to select one of their registered assets before creating a repair request.
- If a customer has no assets, replace the repair form with a clear prompt and button to add their first asset.
- When an asset is selected, prefill its category, brand, and model into the request while keeping issue and visit details request-specific.
- Show the selected asset on request lists/details wherever the request is displayed.

## Data and access rules
- Create a customer-assets record secured so each signed-in customer can only view and manage their own assets.
- Link new repair requests to a customer asset.
- Validate on the server that the selected asset belongs to the customer creating the request.
- Keep existing repair requests valid; the asset requirement applies to all newly created requests.

## Technical details
- Add an authenticated assets page and authenticated server functions for asset management.
- Add an optional asset reference to existing repair-request records for backward compatibility, while requiring it in the new-request server action.
- Update repair-request reads to include the linked asset summary.
- Add route-specific title, description, Open Graph, and Twitter metadata.
