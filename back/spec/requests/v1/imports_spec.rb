require "swagger_helper"

RSpec.describe "Imports", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:Authorization) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:"X-Account") { account.slug }

  path "/v1/import" do
    post "Import a legacy localStorage backup (v1 JSON)" do
      tags "Import"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          projects: { type: :object, additionalProperties: { type: :object } },
          items: { type: :object, additionalProperties: { type: :object } },
          habits: { type: :object, additionalProperties: { type: :array, items: { type: :string } } },
          pomodoros: { type: :object, additionalProperties: { type: :integer } }
        }
      }

      response "201", "everything lands in the current account with fresh ids" do
        schema type: :object, properties: {
          data: {
            type: :object,
            properties: {
              projects: { type: :integer }, items: { type: :integer },
              habits: { type: :integer }, pomodoros: { type: :integer }
            }
          }
        }

        let(:payload) do
          {
            projects: { "old-p1" => { name: "Zenflow", color: "teal", position: 1 } },
            items: {
              "old-i1" => { project_id: "old-p1", type: "task", description: "Ship MVP",
                            status: "IN_DEV", position: 1, planned_start: "2026-04-01" },
              "old-i2" => { project_id: "old-p1", type: "separator", label: "Sprint 1", position: 2 },
              "orphan" => { project_id: "gone", type: "task", description: "skip me", position: 3 }
            },
            habits: { "2026-04-01" => %w[🧘 📖] },
            pomodoros: { "2026-04-01" => 4 }
          }
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]).to eq("projects" => 1, "items" => 2, "habits" => 2, "pomodoros" => 1)

          project = account.projects.sole
          expect(project.name).to eq("Zenflow")
          expect(project.items.ordered.map(&:kind)).to eq(%w[task separator])
          expect(user.reload.pomodoros.sole.count).to eq(4)
        end
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        let(:payload) { {} }
        run_test!
      end
    end
  end
end
