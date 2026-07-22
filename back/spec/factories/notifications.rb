FactoryBot.define do
  factory :notification do
    association :account
    association :recipient, factory: :user
    actor { nil }
    action { "member_added" }
    data { { "message" => "Something happened", "url" => "/dashboard" } }
    read_at { nil }
  end
end
