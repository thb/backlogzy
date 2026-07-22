FactoryBot.define do
  factory :identity do
    association :user
    provider { "google_oauth2" }
    sequence(:uid) { |n| "uid-#{n}" }
    email { "oauth@example.com" }
  end
end
