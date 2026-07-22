require "rails_helper"

# Switching the current account (X-Account) from the user menu must update the
# whole app — including the header label. Regression guard: the account slug
# lives in localStorage (non-reactive), so the switch does a full reload; a plain
# invalidate+navigate left the header stale (see docs/PITFALLS.md).
RSpec.describe "Account switch", type: :feature, js: true do
  let!(:acme) { create(:account, slug: "acme", name: "Acme") }
  let!(:globex) { create(:account, slug: "globex", name: "Globex") }
  let!(:user) { create(:user, email: "admin@example.com", password: "password", name: "Ada Admin") }
  let!(:m_acme) { create(:account_membership, user: user, account: acme, role: "admin") }
  let!(:m_globex) { create(:account_membership, user: user, account: globex, role: "admin") }

  before { login_as(user) }

  it "switches the current account and the header reflects it" do
    find("button[aria-label='Open user menu']").click
    find('[role="menuitem"]', text: "Globex").click

    # Header label must follow the switch (the bug this guards against).
    expect(page).to have_css("header", text: "Globex")

    find("button[aria-label='Open user menu']").click
    find('[role="menuitem"]', text: "Acme").click

    expect(page).to have_css("header", text: "Acme")
  end
end
