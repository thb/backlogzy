FactoryBot.define do
  factory :item do
    association :project
    kind { "task" }
    sequence(:description) { |n| "Task #{n}" }
    status { "TODO" }
    sequence(:position) { |n| n }

    trait :separator do
      kind { "separator" }
      description { "" }
      label { "Section" }
    end
  end
end
