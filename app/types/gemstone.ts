export enum GemstoneShape {
	MARQUISE = "Marquise",
	ROUND = "Round",
	TRILLION = "Trillion",
	OVAL = "Oval",
	PEAR = "Pear",
	SQUARE = "Square",
	OCTAGON = "Octagon",
	EMERALD = "Emerald",
	BAGUETTE = "Baguette",
	CUSHION = "Cushion",
	HEART = "Heart",
	COBOCHON = "Cobochon",
	PRINCESS = "Princess",
	RADIANT = "Radiant",
	ASSCHER = "Asscher",
}

export enum GemstoneColor {
	ROYAL_BLUE = "Royal Blue",
	CORN_FLOWER = "Corn Flower",
	PINKISH_PURPLE = "Pink & Purple",
	NEON_PINK = "Neon Pink",
	HOT_PINK = "Hot Pink",
	BLUE = "Blue",
	RED = "Red",
	PINK = "Pink",
	YELLOW = "Yellow",
	GREEN = "Green",
	ORANGE = "Orange",
	PINK_ORANGE = "Pink & Orange",
	BROWN = "Brown",
	BLACK = "Black",
	WHITE = "White",
	COLORLESS = "Colorless",
	NEON_BLUE = "Neon Blue",
	PURPLE = "Purple",
	MULTI = "Multi-colored",
}

export enum GemstoneType {
	RUBY = "Ruby",
	SAPPHIRE = "Sapphire",
	EMERALD = "Emerald",
	DIAMOND = "Diamond",
	AMETHYST = "Amethyst",
	AQUAMARINE = "Aquamarine",
	TOPAZ = "Topaz",
	OPAL = "Opal",
	GARNET = "Garnet",
	PERIDOT = "Peridot",
	TANZANITE = "Tanzanite",
	TOURMALINE = "Tourmaline",
	CITRINE = "Citrine",
	MORGANITE = "Morganite",
	ALEXANDRITE = "Alexandrite",
	TURQUOISE = "Turquoise",
	JADE = "Jade",
	LAPIS_LAZULI = "Lapis Lazuli",
	MOONSTONE = "Moonstone",
	ONYX = "Onyx",
	PEARL = "Pearl",
	SPINEL = "Spinel",
	ZIRCON = "Zircon",
	OTHER = "Other",
}

export enum Currency {
	USD = "USD",
	GBP = "GBP",
	LKR = "LKR",
	RMB = "RMB",
}

export const CurrencySymbols: Record<Currency, string> = {
	[Currency.USD]: "$",
	[Currency.GBP]: "£",
	[Currency.LKR]: "Rs",
	[Currency.RMB]: "¥",
};

export enum GemTreatmentEnum {
	NATURAL = "natural",
	HEATED = "heated",
}

export const GemTreatmentLabels: Record<GemTreatmentEnum, string> = {
	[GemTreatmentEnum.NATURAL]: "Natural",
	[GemTreatmentEnum.HEATED]: "Heated",
};

export enum GemstoneSize {
	RANGE_0_1 = "0 - 1",
	RANGE_1_2 = "1 - 2",
	RANGE_2_3 = "2 - 3",
	RANGE_3_4 = "3 - 4",
	RANGE_4_5 = "4 - 5",
	RANGE_5_6 = "5 - 6",
	RANGE_6_7 = "6 - 7",
	RANGE_7_8 = "7 - 8",
	RANGE_8_9 = "8 - 9",
	RANGE_9_10 = "9 - 10",
	RANGE_10_PLUS = "10+",
}

export type GemstoneOwner = string;
