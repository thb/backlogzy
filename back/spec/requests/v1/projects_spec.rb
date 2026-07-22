require "swagger_helper"

RSpec.describe "Projects", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:Authorization) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:"X-Account") { account.slug }

  path "/v1/projects" do
    get "List projects (board tabs, ordered by position)" do
      tags "Projects"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]

      response "200", "whole collection scoped to the current account" do
        schema type: :object,
               properties: { data: { type: :array, items: { "$ref" => "#/components/schemas/Project" } } }

        before do
          create(:project, account: account, name: "Second", position: 2)
          create(:project, account: account, name: "First", position: 1)
          create(:project) # other account — must be excluded
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"].map { |p| p["name"] }).to eq(%w[First Second])
        end
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        run_test!
      end
    end

    post "Create a project" do
      tags "Projects"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { project: { type: :object, properties: {
          name: { type: :string }, color: { type: :string }, position: { type: :number }
        }, required: %w[name] } },
        required: %w[project]
      }

      response "201", "created at the end of the tab list" do
        schema type: :object, properties: { data: { "$ref" => "#/components/schemas/Project" } }
        let(:payload) { { project: { name: "New Project" } } }

        before { create(:project, account: account, position: 4) }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]["name"]).to eq("New Project")
          expect(body["data"]["position"]).to eq(5.0)
        end
      end

      response "422", "validation errors" do
        schema "$ref" => "#/components/schemas/ValidationErrors"
        let(:payload) { { project: { name: "" } } }

        run_test! do |response|
          expect(JSON.parse(response.body)["errors"]["name"]).to include("can't be blank")
        end
      end
    end
  end

  path "/v1/projects/reorder" do
    post "Reorder projects (full ordered id list)" do
      tags "Projects"
      consumes "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { ids: { type: :array, items: { type: :string, format: :uuid } } },
        required: %w[ids]
      }

      response "204", "positions rewritten in the given order" do
        let(:first) { create(:project, account: account, position: 1) }
        let(:second) { create(:project, account: account, position: 2) }
        let(:payload) { { ids: [second.id, first.id] } }

        run_test! do
          expect(second.reload.position).to eq(1)
          expect(first.reload.position).to eq(2)
        end
      end

      response "404", "rejects ids from another account" do
        let(:payload) { { ids: [create(:project).id] } }
        run_test!
      end
    end
  end

  path "/v1/projects/{id}" do
    parameter name: :id, in: :path, required: true, schema: { type: :string, format: :uuid }

    let(:record) { create(:project, account: account, name: "Existing") }
    let(:id) { record.id }

    patch "Update a project (rename, recolor)" do
      tags "Projects"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { project: { type: :object } }, required: %w[project]
      }

      response "200", "updated" do
        let(:payload) { { project: { name: "Renamed", color: "teal" } } }
        run_test! { |response| expect(JSON.parse(response.body)["data"]["color"]).to eq("teal") }
      end

      response "404", "not found in this account" do
        let(:id) { create(:project).id }
        let(:payload) { { project: { name: "X" } } }
        run_test!
      end
    end

    delete "Delete a project and its items" do
      tags "Projects"
      security [{ bearer_auth: [], account_header: [] }]

      response "204", "deleted" do
        before { create(:item, project: record) }

        run_test! do
          expect(account.projects.exists?(record.id)).to be(false)
          expect(Item.count).to eq(0)
        end
      end
    end
  end
end
