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
