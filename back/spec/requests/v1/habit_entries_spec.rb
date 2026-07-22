require "swagger_helper"

RSpec.describe "HabitEntries", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:bearer) { "Bearer #{Auth::Token.generate_pair(user)[:access_token]}" }
  let(:Authorization) { bearer }
  let(:"X-Account") { account.slug }

  path "/v1/habit_entries" do
    get "List the current user's habit checks (?from=&to=)" do
      tags "Habits"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :from, in: :query, required: false, schema: { type: :string, format: :date }
      parameter name: :to, in: :query, required: false, schema: { type: :string, format: :date }

      let(:from) { "2026-04-01" }
      let(:to) { "2026-04-07" }

      response "200", "only mine, only in range" do
        before do
          create(:habit_entry, account: account, user: user, date: "2026-04-02", emoji: "🧘")
          create(:habit_entry, account: account, user: user, date: "2026-03-02", emoji: "🧘")
          create(:habit_entry, account: account, date: "2026-04-02") # other user
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body["data"].map { |h| h["date"] }).to eq(%w[2026-04-02])
        end
      end

      response "401", "missing token" do
        let(:Authorization) { nil }
        run_test!
      end
    end
  end

  path "/v1/habit_entries/toggle" do
    post "Toggle a habit for a day" do
      tags "Habits"
      consumes "application/json"
      produces "application/json"
      security [{ bearer_auth: [], account_header: [] }]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { date: { type: :string, format: :date }, emoji: { type: :string } },
        required: %w[date emoji]
      }

      response "200", "checks a habit for the day" do
        let(:payload) { { date: "2026-04-01", emoji: "🧘" } }

        run_test! do |response|
          expect(JSON.parse(response.body)["data"]["active"]).to be(true)
          expect(user.reload.habit_entries.count).to eq(1)
        end
      end

      response "200", "unchecks a habit that was already checked" do
        let(:payload) { { date: "2026-04-01", emoji: "🧘" } }

        before do
          post "/v1/habit_entries/toggle", params: payload.to_json,
                                           headers: { "Authorization" => bearer, "X-Account" => account.slug,
                                                      "Content-Type" => "application/json" }
        end

        run_test! do |response|
          expect(JSON.parse(response.body)["data"]["active"]).to be(false)
          expect(user.reload.habit_entries.count).to eq(0)
        end
      end
    end
  end
end
