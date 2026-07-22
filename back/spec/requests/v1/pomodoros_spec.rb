require "swagger_helper"

RSpec.describe "Pomodoros", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:bearer) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:Authorization) { bearer }
  let(:"X-Account") { account.slug }
  let(:json_headers) do
    { "Authorization" => bearer, "X-Account" => account.slug, "Content-Type" => "application/json" }
  end

  path "/v1/pomodoros" do
    get "List the current user's pomodoro counts (?from=&to=)" do
      tags "Pomodoros"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :from, in: :query, required: false, schema: { type: :string, format: :date }
      parameter name: :to, in: :query, required: false, schema: { type: :string, format: :date }

      let(:from) { "2026-04-01" }
      let(:to) { "2026-04-07" }

      response "200", "only mine, only in range" do
        before do
          create(:pomodoro, account: account, user: user, date: "2026-04-02", count: 3)
          create(:pomodoro, account: account, user: user, date: "2026-03-02")
          create(:pomodoro, account: account, date: "2026-04-02") # other user
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"]).to contain_exactly(include("date" => "2026-04-02", "count" => 3))
        end
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        run_test!
      end
    end
  end

  path "/v1/pomodoros/increment" do
    post "Add a pomodoro to a day" do
      tags "Pomodoros"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { date: { type: :string, format: :date } }, required: %w[date]
      }

      response "200", "creates the row on first use, then counts up" do
        let(:payload) { { date: "2026-04-01" } }

        before { post "/v1/pomodoros/increment", params: payload.to_json, headers: json_headers }

        run_test! do |response|
          expect(JSON.parse(response.body)["data"]["count"]).to eq(2)
          expect(user.reload.pomodoros.sole.count).to eq(2)
        end
      end
    end
  end

  path "/v1/pomodoros/decrement" do
    post "Remove a pomodoro from a day (row disappears at zero)" do
      tags "Pomodoros"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { date: { type: :string, format: :date } }, required: %w[date]
      }

      response "200", "counts down to deletion" do
        let(:payload) { { date: "2026-04-01" } }

        before { create(:pomodoro, account: account, user: user, date: "2026-04-01", count: 1) }

        run_test! do |response|
          expect(JSON.parse(response.body)["data"]).to be_nil
          expect(user.reload.pomodoros.count).to eq(0)
        end
      end
    end
  end
end
