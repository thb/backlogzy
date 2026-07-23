require "swagger_helper"

RSpec.describe "Items", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:bearer) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:Authorization) { bearer }
  let(:"X-Account") { account.slug }
  let(:project) { create(:project, account: account) }

  path "/v1/items" do
    get "List items (?project_id= for one board, ?kind=task for planning)" do
      tags "Items"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :project_id, in: :query, required: false, schema: { type: :string, format: :uuid }
      parameter name: :kind, in: :query, required: false, schema: { type: :string, enum: %w[task separator] }
      parameter name: :with_archived, in: :query, required: false, schema: { type: :boolean }

      let(:project_id) { nil }
      let(:kind) { nil }
      let(:with_archived) { nil }

      response "200", "board items ordered by position" do
        schema type: :object,
               properties: { data: { type: :array, items: { "$ref" => "#/components/schemas/Item" } } }
        let(:project_id) { project.id }

        before do
          create(:item, project: project, description: "Second", position: 2)
          create(:item, project: project, description: "First", position: 1)
          create(:item, project: create(:project, account: account)) # other board
          create(:item) # other account — must be excluded
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"].map { |i| i["description"] }).to eq(%w[First Second])
        end
      end

      response "200", "all tasks across projects with ?kind=task" do
        let(:kind) { "task" }

        before do
          create(:item, project: project)
          create(:item, :separator, project: project)
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"].map { |i| i["kind"] }).to eq(%w[task])
        end
      end

      response "200", "archived items are hidden by default, shown with ?with_archived=true" do
        let(:project_id) { project.id }

        before do
          create(:item, project: project, description: "Live")
          create(:item, project: project, description: "Old", archived_at: Time.current)
        end

        run_test! do |first_response|
          body = JSON.parse(first_response.body)
          expect(body["data"].map { |i| i["description"] }).to eq(%w[Live])

          # `response` (not the shadowed block arg) reads the latest request.
          get "/v1/items", params: { project_id: project.id, with_archived: true },
                           headers: { "Authorization" => bearer, "X-Account" => account.slug }
          all = JSON.parse(response.body)["data"].map { |i| i["description"] }
          expect(all).to contain_exactly("Live", "Old")
        end
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        run_test!
      end
    end

    post "Create an item (task or separator)" do
      tags "Items"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { item: { type: :object, properties: {
          project_id: { type: :string, format: :uuid }, kind: { type: :string },
          description: { type: :string }, label: { type: :string },
          status: { type: :string }, position: { type: :number },
          planned_start: { type: :string, format: :date }, planned_end: { type: :string, format: :date }
        }, required: %w[project_id] } },
        required: %w[item]
      }

      response "201", "created" do
        schema type: :object, properties: { data: { "$ref" => "#/components/schemas/Item" } }
        let(:payload) { { item: { project_id: project.id, description: "Ship it", position: 1 } } }

        run_test! do |response|
          expect(JSON.parse(response.body)["data"]["description"]).to eq("Ship it")
          expect(project.items.count).to eq(1)
        end
      end

      response "404", "rejects a project from another account" do
        let(:payload) { { item: { project_id: create(:project).id } } }
        run_test!
      end

      response "422", "validation errors" do
        schema "$ref" => "#/components/schemas/ValidationErrors"
        let(:payload) { { item: { project_id: project.id, status: "DONE" } } }

        run_test! do |response|
          expect(JSON.parse(response.body)["errors"]).to have_key("status")
        end
      end
    end
  end

  path "/v1/items/reorder" do
    post "Reorder a board (full ordered id list)" do
      tags "Items"
      consumes "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { ids: { type: :array, items: { type: :string, format: :uuid } } },
        required: %w[ids]
      }

      response "204", "positions rewritten in the given order" do
        let(:first) { create(:item, project: project, position: 1) }
        let(:second) { create(:item, project: project, position: 2) }
        let(:payload) { { ids: [second.id, first.id] } }

        run_test! do
          expect(second.reload.position).to eq(1)
          expect(first.reload.position).to eq(2)
        end
      end
    end
  end

  path "/v1/items/archive" do
    post "Archive or unarchive a batch of items (a section block in one call)" do
      tags "Items"
      consumes "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          ids: { type: :array, items: { type: :string, format: :uuid } },
          archived: { type: :boolean }
        },
        required: %w[ids archived]
      }

      response "204", "stamps or clears archived_at on every id" do
        let(:sep) { create(:item, :separator, project: project) }
        let(:task) { create(:item, project: project) }
        let(:payload) { { ids: [sep.id, task.id], archived: true } }

        run_test! do
          expect(sep.reload).to be_archived
          expect(task.reload).to be_archived

          post "/v1/items/archive", params: { ids: [sep.id, task.id], archived: false }.to_json,
                                    headers: { "Authorization" => bearer, "X-Account" => account.slug,
                                               "Content-Type" => "application/json" }
          expect(sep.reload).not_to be_archived
        end
      end

      response "404", "rejects ids from another account" do
        let(:payload) { { ids: [create(:item).id], archived: true } }
        run_test!
      end
    end
  end

  path "/v1/items/{id}" do
    parameter name: :id, in: :path, required: true, schema: { type: :string, format: :uuid }

    let(:record) { create(:item, project: project, description: "Existing") }
    let(:id) { record.id }

    patch "Update an item (inline edits, status, planning drag)" do
      tags "Items"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { item: { type: :object } }, required: %w[item]
      }

      response "200", "updated — project moves stay inside the account" do
        let(:target) { create(:project, account: account) }
        let(:payload) { { item: { project_id: target.id, planned_start: "2026-04-01" } } }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]["project_id"]).to eq(target.id)
          expect(body["data"]["planned_start"]).to eq("2026-04-01")
        end
      end

      response "404", "rejects a move to another account's project" do
        let(:payload) { { item: { project_id: create(:project).id } } }
        run_test!
      end
    end

    delete "Delete an item" do
      tags "Items"
      security [{ bearer_auth: [], account_header: [] }]

      response "204", "deleted" do
        run_test! { expect(Item.exists?(record.id)).to be(false) }
      end

      response "404", "not found in this account" do
        let(:id) { create(:item).id }
        run_test!
      end
    end
  end
end
