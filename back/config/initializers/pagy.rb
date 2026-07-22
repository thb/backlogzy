require "pagy/extras/metadata"

Pagy::DEFAULT[:limit] = 25
Pagy::DEFAULT[:metadata] = %i[count page limit pages]
