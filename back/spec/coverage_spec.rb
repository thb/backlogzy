require "rails_helper"

# Enforces the test-coverage rule: every model has a model spec, and every v1
# controller (except the abstract ApplicationController) has a request spec.
# This gate fails the suite — and the CI — the moment a model/controller ships untested.
RSpec.describe "Spec coverage" do
  before(:all) { Rails.application.eager_load! }

  it "has a model spec for every model" do
    missing = ApplicationRecord.descendants.map(&:name).reject do |name|
      File.exist?(Rails.root.join("spec/models/#{name.underscore}_spec.rb"))
    end

    expect(missing).to be_empty, "Missing model specs for: #{missing.sort.join(', ')}"
  end

  it "has a request spec for every v1 controller" do
    controllers = Dir[Rails.root.join("app/controllers/v1/*_controller.rb")]
                  .map { |f| File.basename(f, ".rb") } - ["application_controller"]

    missing = controllers.reject do |controller|
      resource = controller.sub(/_controller$/, "")
      File.exist?(Rails.root.join("spec/requests/v1/#{resource}_spec.rb"))
    end

    expect(missing).to be_empty, "Missing request specs for v1 controllers: #{missing.sort.join(', ')}"
  end
end
