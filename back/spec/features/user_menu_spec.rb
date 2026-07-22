require "rails_helper"

# The user menu is a Radix DropdownMenu (a real overlay). This proves it opens and
# its items work with Capybara/Selenium — the reason overlays use Radix, not a custom
# useState + mousedown dropdown.
RSpec.describe "User menu", type: :feature, js: true do
  let!(:account) { create(:account, slug: "acme") }
  let!(:user) { create(:user, email: "admin@example.com", password: "password", name: "Ada Admin") }
  let!(:membership) { create(:account_membership, user: user, account: account) }

  before { login_as(user) }

  it "opens the menu and logs out" do
    find("button[aria-label='Open user menu']").click

    expect(page).to have_content("admin@example.com")

    find('[role="menuitem"]', text: "Log out").click

    expect(page).to have_button("Sign in")
  end

  it "edits the profile name from settings" do
    find("button[aria-label='Open user menu']").click
    find('[role="menuitem"]', text: "Settings").click

    expect(page).to have_field("name")
    fill_in "name", with: "Ada R. Admin"
    click_button "Save"

    expect(page).to have_content("Saved")

    find("button[aria-label='Open user menu']").click
    expect(page).to have_content("Ada R. Admin")
  end

  it "changes the password from settings" do
    find("button[aria-label='Open user menu']").click
    find('[role="menuitem"]', text: "Settings").click

    expect(page).to have_field("current_password")
    fill_in "current_password", with: "password"
    fill_in "password", with: "newsecret123"
    click_button "Change password"

    expect(page).to have_content("Password changed")
  end
end
