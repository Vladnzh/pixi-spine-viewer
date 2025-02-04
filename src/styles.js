export const baseTheme = {
	light: {
		background: "#f2f2f2",
		headerBg: "#3f51b5",
		headerText: "#ffffff",
		sidebarBg: "#ffffff",
		sidebarText: "#333333",
		buttonBg: "#4caf50",
		buttonText: "#ffffff",
		removeButtonBg: "#f44336",
		inputBg: "#ffffff",
		inputBorder: "#cccccc",
		dropZoneBg: "#ffffff"
	},
	dark: {
		background: "#2b2b2b",
		headerBg: "#3b3b3b",
		headerText: "#ffffff",
		sidebarBg: "#3b3b3b",
		sidebarText: "#cccccc",
		buttonBg: "#4caf50",
		buttonText: "#ffffff",
		removeButtonBg: "#f44336",
		inputBg: "#555555",
		inputBorder: "#777777",
		dropZoneBg: "#444444"
	}
};

const scaleFactor = 0.75;
const playButtonColor = "#6699FF";
const pauseButtonColor = "#B0B0B0";

export const getStyles = (theme) => {
	const currentTheme = baseTheme[theme];
	return {
		wrapper: {
			display: "flex",
			flexDirection: "column",
			height: "100vh",
			overflow: "hidden",
			margin: 0,
			padding: 0,
			fontFamily: "Arial, sans-serif",
			backgroundColor: currentTheme.background,
			boxSizing: "border-box",
			color: currentTheme.sidebarText,
			fontSize: `${scaleFactor * 16}px`
		},
		header: {
			position: "relative",
			padding: `${scaleFactor * 8}px ${scaleFactor * 16}px`,
			backgroundColor: currentTheme.headerBg,
			color: currentTheme.headerText,
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			borderBottom: "1px solid rgba(255,255,255,0.3)"
		},
		headerLeft: {
			fontSize: `${scaleFactor * 19.2}px`,
			fontWeight: "bold"
		},
		headerCenter: {
			position: "absolute",
			left: "50%",
			transform: "translateX(-50%)",
			fontSize: `${scaleFactor * 14.4}px`
		},
		headerRight: {
			display: "flex",
			alignItems: "center",
			gap: `${scaleFactor * 10}px`
		},
		currentThemeText: {
			fontSize: `${scaleFactor * 14.4}px`
		},
		githubLink: {
			color: currentTheme.headerText,
			textDecoration: "none",
			fontWeight: "bold"
		},
		mainContent: {
			display: "flex",
			flex: 1,
			overflow: "hidden"
		},
		leftColumn: {
			flex: 1,
			display: "flex",
			flexDirection: "column",
			margin: `${scaleFactor * 10}px`,
			overflow: "hidden"
		},
		dropZone: {
			flex: 1,
			position: "relative",
			border: "2px dashed #bbb",
			borderRadius: `${scaleFactor * 8}px`,
			backgroundColor: currentTheme.dropZoneBg,
			overflow: "hidden",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: `${scaleFactor * 10}px`
		},
		dropText: {
			zIndex: 2,
			color: theme === "dark" ? "#ffffff" : "#888888",
			textAlign: "center",
			fontSize: `${scaleFactor * 16}px`
		},
		pixiContainer: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			zIndex: 1
		},
		sidebar: {
			width: `${scaleFactor * 300}px`,
			flexShrink: 0,
			margin: `${scaleFactor * 10}px`,
			padding: `${scaleFactor * 10}px`,
			borderRadius: `${scaleFactor * 8}px`,
			backgroundColor: currentTheme.sidebarBg,
			boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
			display: "flex",
			flexDirection: "column"
		},
		fixedArea: {
			marginBottom: `${scaleFactor * 10}px`,
			paddingBottom: `${scaleFactor * 10}px`
		},
		sectionHeader: {
			marginBottom: `${scaleFactor * 8}px`,
			fontSize: `${scaleFactor * 16}px`,
			fontWeight: "bold",
			paddingBottom: `${scaleFactor * 4}px`
		},
		input: {
			width: "100%",
			padding: `${scaleFactor * 8}px`,
			marginTop: `${scaleFactor * 8}px`,
			borderRadius: `${scaleFactor * 4}px`,
			border: `1px solid ${currentTheme.inputBorder}`,
			boxSizing: "border-box",
			backgroundColor: currentTheme.inputBg,
			color: currentTheme.sidebarText,
			fontSize: `${scaleFactor * 14.4}px`
		},
		scaleControl: {
			marginTop: `${scaleFactor * 8}px`,
			marginBottom: `${scaleFactor * 8}px`
		},
		sliderLabel: {
			fontSize: `${scaleFactor * 14.4}px`
		},
		animationsSelect: {
			width: "100%",
			padding: `${scaleFactor * 8}px`,
			borderRadius: `${scaleFactor * 4}px`,
			border: `1px solid ${currentTheme.inputBorder}`,
			boxSizing: "border-box",
			fontSize: `${scaleFactor * 14.4}px`,
			height: `${scaleFactor * 36}px`,
			marginTop: `${scaleFactor * 8}px`,
			marginBottom: `${scaleFactor * 8}px`
		},
		fullWidthButton: {
			width: "100%",
			padding: `${scaleFactor * 8}px ${scaleFactor * 12}px`,
			border: "none",
			borderRadius: `${scaleFactor * 4}px`,
			color: "#ffffff",
			cursor: "pointer",
			fontSize: `${scaleFactor * 14.4}px`,
			height: `${scaleFactor * 36}px`,
			marginTop: `${scaleFactor * 8}px`,
			marginBottom: `${scaleFactor * 8}px`
		},
		slotItem: {
			marginBottom: `${scaleFactor * 10}px`,
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			paddingBottom: `${scaleFactor * 4}px`
		},
		unattachedButton: {
			padding: `${scaleFactor * 4}px ${scaleFactor * 8}px`,
			border: "none",
			borderRadius: `${scaleFactor * 4}px`,
			backgroundColor: currentTheme.buttonBg,
			color: currentTheme.buttonText,
			cursor: "pointer",
			fontSize: `${scaleFactor * 14.4}px`
		},
		deleteButton: {
			padding: `${scaleFactor * 4}px ${scaleFactor * 8}px`,
			border: "none",
			borderRadius: `${scaleFactor * 4}px`,
			backgroundColor: "#f44336",
			color: currentTheme.buttonText,
			cursor: "pointer",
			fontSize: `${scaleFactor * 14.4}px`
		},
		attachedSlotItem: {
			margin: `${scaleFactor * 4}px 0`,
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between"
		},
		unattachedList: {
			flex: 1,
			overflowY: "auto",
			marginTop: `${scaleFactor * 8}px`,
			border: `1px solid ${currentTheme.inputBorder}`,
			borderRadius: `${scaleFactor * 4}px`,
			padding: `${scaleFactor * 8}px`
		},
		toggleSwitch: {
			position: "relative",
			display: "inline-block",
			width: `${scaleFactor * 50}px`,
			height: `${scaleFactor * 24}px`
		},
		toggleSlider: (theme) => ({
			position: "absolute",
			cursor: "pointer",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: theme === "light" ? "#4caf50" : "#cccccc",
			transition: ".4s",
			borderRadius: `${scaleFactor * 24}px`
		}),
		toggleKnob: (theme) => ({
			position: "absolute",
			height: `${scaleFactor * 18}px`,
			width: `${scaleFactor * 18}px`,
			left: theme === "light" ? `${scaleFactor * 26}px` : `${scaleFactor * 3}px`,
			bottom: `${scaleFactor * 3}px`,
			backgroundColor: "#ffffff",
			transition: ".4s",
			borderRadius: "50%"
		}),
		playButtonColor,
		pauseButtonColor
	};
};