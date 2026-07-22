FactoryBot.define do
  factory :project do
    association :account
    sequence(:name) { |n| "Project #{n}" }
    color { "gray" }
    sequence(:position) { |n| n }
  end
end
