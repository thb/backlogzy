FactoryBot.define do
  factory :account_membership do
    association :user
    association :account
    role { "admin" }
    active { true }
  end
end
