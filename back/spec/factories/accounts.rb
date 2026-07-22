FactoryBot.define do
  factory :account do
    sequence(:slug) { |n| "account-#{n}" }
    name { "Test Account" }
  end
end
