require "swagger_helper"

# rswag DSL: request suite + OpenAPI source for the notifications endpoints.
RSpec.describe "Notifications", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:Authorization) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:"X-Account") { account.slug }

  path "/v1/notifications" do
    get "List the current user's notifications (recent first)" do
      tags "Notifications"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :unread, in: :query, required: false, schema: { type: :boolean }
      parameter name: :page, in: :query, required: false, schema: { type: :integer }

      let(:unread) { nil }
      let(:page) { nil }

      response "200", "scoped to the current user + account, with unread_count in meta" do
        schema type: :object,
               properties: {
                 data: { type: :array, items: { "$ref" => "#/components/schemas/Notification" } },
                 meta: {
                   type: :object,
                   properties: {
                     count: { type: :integer }, page: { type: :integer },
                     limit: { type: :integer }, pages: { type: :integer },
                     unread_count: { type: :integer }
                   }
                 }
               }

        before do
          create(:notification, account: account, recipient: user)
          create(:notification, account: account, recipient: user, read_at: Time.current)
          create(:notification, account: account, recipient: create(:user)) # other recipient — excluded
          create(:notification, recipient: user)                            # other account — excluded
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"].size).to eq(2)
          expect(body["meta"]).to include("unread_count" => 1)
        end
      end

      response "200", "filtered to unread only" do
        let(:unread) { true }

        before do
          create(:notification, account: account, recipient: user)
          create(:notification, account: account, recipient: user, read_at: Time.current)
        end

        run_test! { |response| expect(JSON.parse(response.body)["data"].size).to eq(1) }
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        run_test!
      end
    end
  end

  path "/v1/notifications/{id}/read" do
    parameter name: :id, in: :path, required: true, schema: { type: :string, format: :uuid }
    let(:notification) { create(:notification, account: account, recipient: user) }
    let(:id) { notification.id }

    patch "Mark a notification read" do
      tags "Notifications"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]

      response "200", "marked read" do
        schema type: :object, properties: { data: { "$ref" => "#/components/schemas/Notification" } }
        run_test! { |response| expect(JSON.parse(response.body)["data"]["read"]).to be(true) }
      end

      response "404", "another user's notification" do
        let(:id) { create(:notification, account: account, recipient: create(:user)).id }
        run_test!
      end
    end
  end

  path "/v1/notifications/read_all" do
    post "Mark all the current user's notifications read" do
      tags "Notifications"
      security [{ bearer_auth: [], account_header: [] }]

      response "204", "all marked read" do
        before { create_list(:notification, 3, account: account, recipient: user) }

        run_test! do
          expect(Notification.where(recipient: user, account: account).unread.count).to eq(0)
        end
      end
    end
  end
end
