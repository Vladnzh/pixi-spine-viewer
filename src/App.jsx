import React, { useState, useCallback, useRef, useEffect } from "react";
import { Application, BaseTexture, Graphics, Text } from "pixi.js";
import { Spine, TextureAtlas } from "pixi-spine";
import { AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/runtime-4.1";
import { getStyles } from "./styles";

function modifyAtlasText(atlasText, fileURLs) {
	return atlasText;
}

function App() {
	const [spineLoaded, setSpineLoaded] = useState(false);
	const [animationPlaying, setAnimationPlaying] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [scaleValue, setScaleValue] = useState(0.5);
	const [speedValue, setSpeedValue] = useState(1.0);
	const [slotFilter, setSlotFilter] = useState("");
	const [availableAnimations, setAvailableAnimations] = useState([]);
	const [selectedAnimation, setSelectedAnimation] = useState("");
	const [availableSkins, setAvailableSkins] = useState([]);
	const [selectedSkin, setSelectedSkin] = useState("");
	const [attachedSlots, setAttachedSlots] = useState([]);
	const [circleScaleValue, setCircleScaleValue] = useState(1.0);
	const [theme, setTheme] = useState("dark");

	const pixiContainerRef = useRef(null);
	const pixiAppRef = useRef(null);
	const spineInstanceRef = useRef(null);
	const attachedCirclesRef = useRef({});
	const filesDataRef = useRef({});

	const styles = getStyles(theme);

	const ThemeToggle = ({ theme, toggleTheme }) => (
		<label style={styles.toggleSwitch}>
			<input type="checkbox" checked={theme === "light"} onChange={toggleTheme} style={{ display: "none" }} />
			<span style={styles.toggleSlider(theme)}>
        <span style={styles.toggleKnob(theme)}></span>
      </span>
		</label>
	);

	const updateSpinePosition = useCallback(() => {
		if (pixiAppRef.current && spineInstanceRef.current) {
			const spine = spineInstanceRef.current;
			spine.updateTransform();
			const bounds = spine.getLocalBounds();
			const { width, height } = pixiAppRef.current.screen;
			spine.scale.set(scaleValue);
			spine.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
			spine.x = width / 2;
			spine.y = height / 2;
		}
	}, [scaleValue]);

	useEffect(() => {
		if (!pixiAppRef.current && pixiContainerRef.current) {
			const app = new Application({
				width: pixiContainerRef.current.clientWidth,
				height: pixiContainerRef.current.clientHeight,
				backgroundAlpha: 1,
				backgroundColor: 0x888888,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true
			});
			pixiContainerRef.current.appendChild(app.view);
			pixiAppRef.current = app;
		}
	}, []);

	useEffect(() => {
		if (!pixiContainerRef.current) return;
		const observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				const { width, height } = entry.contentRect;
				if (pixiAppRef.current) {
					pixiAppRef.current.renderer.resize(width, height);
					updateSpinePosition();
				}
			}
		});
		observer.observe(pixiContainerRef.current);
		return () => observer.disconnect();
	}, [updateSpinePosition]);

	const updateCircles = useCallback(() => {
		if (!spineInstanceRef.current) return;
		for (const slotName in attachedCirclesRef.current) {
			const circle = attachedCirclesRef.current[slotName];
			const slot = spineInstanceRef.current.skeleton.findSlot(slotName);
			if (slot && slot.bone) {
				circle.x = slot.bone.worldX;
				circle.y = slot.bone.worldY;
			}
		}
	}, []);

	useEffect(() => {
		if (pixiAppRef.current) {
			pixiAppRef.current.ticker.add(updateCircles);
			return () => {
				pixiAppRef.current.ticker.remove(updateCircles);
			};
		}
	}, [updateCircles]);

	const handleScaleChange = (e) => {
		const newScale = parseFloat(e.target.value);
		setScaleValue(newScale);
		updateSpinePosition();
	};

	const handleSpeedChange = (e) => {
		const newSpeed = parseFloat(e.target.value);
		setSpeedValue(newSpeed);
		if (spineInstanceRef.current && animationPlaying) {
			spineInstanceRef.current.state.timeScale = newSpeed;
		}
	};

	const handleCircleScaleChange = (e) => {
		const newScale = parseFloat(e.target.value);
		setCircleScaleValue(newScale);
		Object.values(attachedCirclesRef.current).forEach((circle) => {
			circle.scale.set(newScale);
		});
	};

	const onDrop = useCallback(
		(event) => {
			event.preventDefault();
			setErrorMsg("");
			setSpineLoaded(false);
			setAnimationPlaying(false);
			setAvailableAnimations([]);
			setSelectedAnimation("");
			setAttachedSlots([]);
			for (const key in attachedCirclesRef.current) {
				if (spineInstanceRef.current) {
					spineInstanceRef.current.removeChild(attachedCirclesRef.current[key]);
					attachedCirclesRef.current[key].destroy();
				}
			}
			attachedCirclesRef.current = {};
			if (spineInstanceRef.current && pixiAppRef.current) {
				pixiAppRef.current.stage.removeChild(spineInstanceRef.current);
				spineInstanceRef.current.destroy();
				spineInstanceRef.current = null;
			}
			const files = event.dataTransfer.files;
			if (!files || files.length === 0) {
				setErrorMsg("Files not found");
				return;
			}
			const filesMap = {};
			for (let i = 0; i < files.length; i++) {
				filesMap[files[i].name] = files[i];
			}
			const fileURLs = {};
			for (const name in filesMap) {
				fileURLs[name] = URL.createObjectURL(filesMap[name]);
			}
			filesDataRef.current = fileURLs;
			let jsonFileName = null;
			let atlasFileName = null;
			for (const name in filesMap) {
				const lower = name.toLowerCase();
				if (lower.endsWith(".json")) jsonFileName = name;
				else if (lower.endsWith(".atlas")) atlasFileName = name;
			}
			if (!jsonFileName || !atlasFileName) {
				setErrorMsg("Required files (JSON and ATLAS) not found");
				return;
			}
			const readerJSON = new FileReader();
			const readerAtlas = new FileReader();
			let jsonText = "";
			let atlasText = "";
			readerJSON.onload = (e) => {
				jsonText = e.target.result;
				if (atlasText) {
					try {
						const jsonData = JSON.parse(jsonText);
						createSpineAnimation(jsonData, atlasText, fileURLs);
					} catch (err) {
						console.error("Error parsing JSON file:", err);
						setErrorMsg("Error parsing JSON file: " + err.message);
					}
				}
			};
			readerJSON.onerror = (err) => {
				console.error("Error reading JSON file:", err);
				setErrorMsg("Error reading JSON file");
			};
			readerAtlas.onload = (e) => {
				atlasText = e.target.result;
				if (jsonText) {
					try {
						const jsonData = JSON.parse(jsonText);
						createSpineAnimation(jsonData, atlasText, fileURLs);
					} catch (err) {
						console.error("Error parsing JSON file:", err);
						setErrorMsg("Error parsing JSON file: " + err.message);
					}
				}
			};
			readerAtlas.onerror = (err) => {
				console.error("Error reading ATLAS file:", err);
				setErrorMsg("Error reading ATLAS file");
			};
			readerJSON.readAsText(filesMap[jsonFileName]);
			readerAtlas.readAsText(filesMap[atlasFileName]);
		},
		[updateSpinePosition]
	);

	const onDragOver = useCallback((event) => {
		event.preventDefault();
	}, []);

	const createSpineAnimation = (jsonData, atlasText, fileURLs) => {
		if (!pixiAppRef.current) return;
		const modifiedAtlasText = modifyAtlasText(atlasText, fileURLs);
		function getTextureForLine(line, fileURLs) {
			if (fileURLs[line]) return BaseTexture.from(fileURLs[line]);
			const lowerLine = line.toLowerCase();
			for (const key in fileURLs) {
				if (key.toLowerCase() === lowerLine) return BaseTexture.from(fileURLs[key]);
			}
			return null;
		}
		try {
			const spineAtlas = new TextureAtlas(modifiedAtlasText, (line, callback) => {
				const texture = getTextureForLine(line, fileURLs);
				if (texture) callback(texture);
				else {
					console.error("Texture not found for line:", line);
					callback(null);
				}
			});
			const atlasLoader = new AtlasAttachmentLoader(spineAtlas);
			const skeletonJson = new SkeletonJson(atlasLoader);
			const skeletonData = skeletonJson.readSkeletonData(jsonData);
			const skins = skeletonData.skins.map((skin) => skin.name);
			setAvailableSkins(skins);
			setSelectedSkin(skins[0] || "");
			const spineAnimation = new Spine(skeletonData);
			spineAnimation.skeleton.updateWorldTransform();
			const bounds = spineAnimation.getLocalBounds();
			spineAnimation.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
			spineAnimation.x = pixiAppRef.current.screen.width / 2;
			spineAnimation.y = pixiAppRef.current.screen.height / 2;
			spineAnimation.scale.set(scaleValue);
			spineAnimation.drawDebug = false;
			spineAnimation.drawBones = false;
			spineAnimation.drawRegionAttachments = false;
			spineAnimation.drawClipping = false;
			spineAnimation.drawMeshHull = false;
			spineAnimation.drawMeshTriangles = false;
			spineAnimation.drawPaths = false;
			spineAnimation.drawBoundingBoxes = false;
			spineInstanceRef.current = spineAnimation;
			pixiAppRef.current.stage.addChild(spineAnimation);
			if (skeletonData.animations.length > 0) {
				const animName = skeletonData.animations[0].name;
				spineAnimation.state.setAnimation(0, animName, true);
				setAnimationPlaying(true);
				setAvailableAnimations(skeletonData.animations.map((anim) => anim.name));
				setSelectedAnimation(animName);
				spineAnimation.state.timeScale = speedValue;
			}
			setSpineLoaded(true);
			updateSpinePosition();
		} catch (err) {
			console.error("Error creating Spine animation:", err);
			setErrorMsg("Error creating Spine animation: " + err.message);
		}
	};

	const handleSkinSelect = (e) => {
		const skinName = e.target.value;
		setSelectedSkin(skinName);
		if (spineInstanceRef.current) {
			const skeleton = spineInstanceRef.current.skeleton;
			const skin = skeleton.data.skins.find((s) => s.name === skinName);
			if (skin) {
				skeleton.setSkin(skin);
				skeleton.setSlotsToSetupPose();
				updateSpinePosition();
			} else {
				console.warn(`Skin "${skinName}" not found.`);
			}
		}
	};

	const toggleAnimation = () => {
		if (!spineInstanceRef.current) return;
		const state = spineInstanceRef.current.state;
		if (animationPlaying) {
			state.timeScale = 0;
			setAnimationPlaying(false);
		} else {
			state.timeScale = speedValue;
			setAnimationPlaying(true);
		}
	};

	const handleAnimationSelect = (e) => {
		const animName = e.target.value;
		setSelectedAnimation(animName);
		if (spineInstanceRef.current) {
			spineInstanceRef.current.state.setAnimation(0, animName, true);
			spineInstanceRef.current.state.timeScale = speedValue;
			updateSpinePosition();
			setAnimationPlaying(true);
		}
	};

	const addCircleToSlot = (slotName) => {
		if (!spineInstanceRef.current) return;
		if (attachedCirclesRef.current[slotName]) return;
		const circle = new Graphics();
		const circleRadius = 500;
		circle.beginFill(0xFBF8FF);
		circle.drawCircle(0, 0, circleRadius);
		circle.endFill();
		circle.scale.set(circleScaleValue);
		const fontSize = circleRadius * 2 * 0.2;
		const text = new Text(slotName, {
			fontFamily: "Arial",
			fontSize: fontSize,
			fill: "#ea8510",
			align: "center",
			wordWrap: true,
			wordWrapWidth: circleRadius * 2
		});
		text.anchor.set(0.5);
		circle.addChild(text);
		spineInstanceRef.current.addChild(circle);
		attachedCirclesRef.current[slotName] = circle;
		setAttachedSlots((prev) => (prev.includes(slotName) ? prev : [...prev, slotName]));
	};

	const removeCircleFromSlot = (slotName) => {
		if (!spineInstanceRef.current) return;
		const circle = attachedCirclesRef.current[slotName];
		if (circle) {
			spineInstanceRef.current.removeChild(circle);
			circle.destroy();
			delete attachedCirclesRef.current[slotName];
			setAttachedSlots((prev) => prev.filter((name) => name !== slotName));
		}
	};

	const allSlots = spineInstanceRef.current
		? spineInstanceRef.current.skeleton.slots.map((slot) => slot.data.name)
		: [];
	const filteredSlots = allSlots.filter((slot) =>
		slot.toLowerCase().includes(slotFilter.toLowerCase())
	);
	const unAttachedSlots = filteredSlots.filter((slot) => !attachedSlots.includes(slot));

	const playPauseButtonStyle = {
		...styles.fullWidthButton,
		backgroundColor: animationPlaying ? styles.pauseButtonColor : styles.playButtonColor
	};

	return (
		<div style={styles.wrapper}>
			<header style={styles.header}>
				<div style={styles.headerLeft}>Pixi Spine Viewer Tool</div>
				<div style={styles.headerCenter}>
					<a href="https://github.com/Vladnzh/pixi-spine-viewer" target="_blank" rel="noopener noreferrer" style={styles.githubLink}>
						GitHub: pixi-spine-viewer
					</a>
				</div>
				<div style={styles.headerRight}>
					<span style={styles.currentThemeText}>{theme === "dark" ? "Dark" : "Light"}</span>
					<ThemeToggle theme={theme} toggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))} />
				</div>
			</header>
			<div style={styles.mainContent}>
				<div style={styles.leftColumn}>
					<div style={styles.dropZone} onDrop={onDrop} onDragOver={onDragOver}>
						{!spineLoaded && (
							<p style={styles.dropText}>
								Drag and drop Spine files (JSON, ATLAS, images) here
							</p>
						)}
						<div ref={pixiContainerRef} style={styles.pixiContainer} />
						{errorMsg && <p>{errorMsg}</p>}
					</div>
				</div>
				<div style={styles.sidebar}>
					<div style={styles.fixedArea}>
						<h3 style={styles.sectionHeader}>Animations</h3>
						<select style={styles.animationsSelect} value={selectedAnimation} onChange={handleAnimationSelect}>
							{availableAnimations.map((animName, idx) => (
								<option key={idx} value={animName}>
									{animName}
								</option>
							))}
						</select>
						{availableSkins.length > 0 && (
							<select style={styles.animationsSelect} value={selectedSkin} onChange={handleSkinSelect}>
								{availableSkins.map((skinName, idx) => (
									<option key={idx} value={skinName}>
										{skinName}
									</option>
								))}
							</select>
						)}
						<div style={styles.scaleControl}>
							<label style={styles.sliderLabel}>Spine Scale: {scaleValue.toFixed(2)}</label>
							<input type="range" min="0.1" max="2" step="0.01" value={scaleValue} onChange={handleScaleChange} style={styles.input} />
						</div>
						<div style={styles.scaleControl}>
							<label style={styles.sliderLabel}>Speed: {speedValue.toFixed(2)}</label>
							<input type="range" min="0.1" max="2" step="0.01" value={speedValue} onChange={handleSpeedChange} style={styles.input} />
						</div>
						<button style={playPauseButtonStyle} onClick={toggleAnimation}>
							{animationPlaying ? "Pause" : "Play"}
						</button>
					</div>
					<div style={styles.fixedArea}>
						<label style={styles.sliderLabel}>Circle Scale: {circleScaleValue.toFixed(2)}</label>
						<input type="range" min="0.01" max="2" step="0.01" value={circleScaleValue} onChange={handleCircleScaleChange} style={styles.input} />
					</div>
					<div style={styles.fixedArea}>
						<h3 style={styles.sectionHeader}>Slots</h3>
						<input type="text" placeholder="Filter slots" value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)} style={styles.animationsSelect} />
						{attachedSlots.length > 0 &&
							attachedSlots.map((slotName, idx) => (
								<div key={idx} style={styles.attachedSlotItem}>
									<span>{slotName}</span>
									<button style={styles.deleteButton} onClick={() => removeCircleFromSlot(slotName)}>
										Delete
									</button>
								</div>
							))}
					</div>
					<div style={styles.unattachedList}>
						{spineLoaded && unAttachedSlots.length > 0 ? (
							unAttachedSlots.map((slotName, idx) => (
								<div key={idx} style={styles.slotItem}>
									<span>{slotName}</span>
									<button style={styles.unattachedButton} onClick={() => addCircleToSlot(slotName)}>
										Add Circle
									</button>
								</div>
							))
						) : (
							<p>No slots to display</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;