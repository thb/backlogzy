require "rails_helper"

# The critical user journey of the product: land on the board, create a project,
# add a task, edit it inline, change its status, delete it.
RSpec.describe "Board", type: :feature, js: true do
  let!(:account) { create(:account, slug: "acme", name: "Acme") }
  let!(:user) { create(:user, email: "admin@example.com", password: "password", name: "Ada") }
  let!(:membership) { create(:account_membership, user: user, account: account) }

  before { login_as(user) }

  it "creates a project, then a task, edits it and deletes it" do
    # Empty workspace → creation empty state
    expect(page).to have_content("No project yet")
    fill_in "Project name...", with: "Zenflow"
    click_button "New project"

    expect(page).to have_content("Zenflow") # tab appears

    click_button "+ Add task"
    expect(page).to have_css("input[placeholder='Description...']")

    # Inline edit: click to enter edit mode (readOnly otherwise), Enter commits.
    # The update is optimistic, so poll the DB.
    description_input = find("input[placeholder='Description...']")
    description_input.click
    description_input.send_keys("Ship the MVP", :enter)
    wait_for { Item.find_by(description: "Ship the MVP") }

    # Status change via the select — IN_QA stamps completed_at
    task = Item.find_by(description: "Ship the MVP")
    find("select").select("IN Q/A")
    wait_for { task.reload.status == "IN_QA" }
    expect(task.completed_at).to be_present

    # Delete through the confirm dialog. Row actions appear on hover or when the
    # row has focus (focus-within) — focusing the description input is the
    # deterministic path in headless CI, where Selenium hover is flaky.
    find("input[placeholder='Description...']").click
    find("button[title='Delete']").click
    within(find("div.z-50", text: "Delete task?")) { click_button "Delete" }
    expect(page).to have_no_css("input[placeholder='Description...']")
    wait_for { !Item.exists?(task.id) }
  end

  it "adds a separator row" do
    project = create(:project, account: account, name: "Ops")
    expect(page).to have_link("Boards") # login has landed before re-visiting
    visit "/board?project=#{project.id}"

    click_button "+ Add separator"
    expect(page).to have_css("input[placeholder='Section name...']")
    wait_for { project.items.where(kind: "separator").count == 1 }
  end

  # Optimistic mutations mean the UI can be ahead of the DB; poll briefly.
  def wait_for(timeout: 5)
    deadline = Time.current + timeout
    loop do
      result = yield
      return result if result

      raise "condition not met within #{timeout}s" if Time.current > deadline

      sleep 0.1
    end
  end
end
