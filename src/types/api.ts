export interface WeddingDay {
  id: number
  dayNumber: number
  themeName: string
  date: string
}

export interface CategoryDto {
  id: number
  name: string
  displayOrder: number
}

export interface DayCategoriesResponse {
  dayId: number
  dayThemeName: string
  categories: CategoryDto[]
}

export interface WeddingItemDto {
  id: number
  dayId: number
  categoryId: number
  categoryName: string
  name: string
  vendorName: string | null
  notes: string | null
  estimatedCost: number | null
  depositPaid: number | null
  outstandingFees: number | null
  percentageComplete: number | null
  attributesJson: string | null
}

export interface CreateWeddingItemRequest {
  dayId: number
  categoryId: number
  name: string
  vendorName?: string | null
  notes?: string | null
  estimatedCost?: number | null
  depositPaid?: number | null
  outstandingFees?: number | null
  percentageComplete?: number | null
  attributesJson?: string | null
}
