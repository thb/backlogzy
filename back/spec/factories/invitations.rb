FactoryBot.define do
  factory :invitation do
    association :account
    sequence(:email) { |n| "invitee#{n}@example.com" }
    role { "member" }
  end
end
