export enum GemstoneShape {
	ROUND = "Round",
	OVAL = "Oval",
	CUSHION = "Cushion",
	PRINCESS = "Princess",
	EMERALD = "Emerald",
	PEAR = "Pear",
	MARQUISE = "Marquise",
	RADIANT = "Radiant",
	HEART = "Heart",
	TRILLION = "Trillion",
	BAGUETTE = "Baguette",
	ASSCHER = "Asscher",
}

export enum GemstoneColor {
	RED = "Red",
	BLUE = "Blue",
	GREEN = "Green",
	YELLOW = "Yellow",
	PURPLE = "Purple",
	PINK = "Pink",
	ORANGE = "Orange",
	BROWN = "Brown",
	BLACK = "Black",
	WHITE = "White",
	COLORLESS = "Colorless",
	MULTI = "Multi-colored",
}

export enum GemstoneCut {
	BRILLIANT = "Brilliant",
	STEP = "Step",
	MIXED = "Mixed",
	CABOCHON = "Cabochon",
	FACETED = "Faceted",
	ROSE = "Rose",
	ROUGH = "Rough",
	CARVED = "Carved",
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

export enum GemTypeEnum {
	NATURAL = "natural",
	HEATED = "heated",
}

export const GemTypeLabels: Record<GemTypeEnum, string> = {
	[GemTypeEnum.NATURAL]: "Natural",
	[GemTypeEnum.HEATED]: "Heated",
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
