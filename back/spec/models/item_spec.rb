require "rails_helper"

RSpec.describe Item, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:project) }
  end

  describe "validations" do
    it "only accepts a known kind" do
      expect(build(:item, kind: "task")).to be_valid
      expect(build(:item, kind: "separator")).to be_valid
      expect(build(:item, kind: "note")).not_to be_valid
    end

    it "only accepts a known status" do
      expect(build(:item, status: "IN_DEV")).to be_valid
      expect(build(:item, status: "DONE")).not_to be_valid
    end
  end

  describe "scopes" do
    let(:account) { create(:account) }
    let(:project) { create(:project, account: account) }

    it ".by_project filters on the project" do
      mine = create(:item, project: project)
      create(:item, project: create(:project, account: account))

      expect(Item.by_project(project.id)).to contain_exactly(mine)
    end

    it ".by_kind filters tasks from separators" do
      task = create(:item, project: project)
      create(:item, :separator, project: project)

      expect(Item.by_kind("task")).to contain_exactly(task)
    end

    it ".ordered sorts by position (supports fractional inserts)" do
      last = create(:item, project: project, position: 3)
      middle = create(:item, project: project, position: 2.5)
      first = create(:item, project: project, position: 2)

      expect(project.items.ordered).to eq([first, middle, last])
    end
  end
end
