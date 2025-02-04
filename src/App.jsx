import React, { useState, useCallback, useRef, useEffect } from "react";
import { Application, BaseTexture, Graphics } from "pixi.js";
import { Spine, TextureAtlas } from "pixi-spine";
import { AtlasAttachmentLoader, SkeletonJson } from "@pixi-spine/runtime-4.0";

function modifyAtlasText(atlasText, fileURLs) {
	// В данном примере ATLAS-текст не изменяется.
	return atlasText;
}

function App() {
	// Состояния для управления UI
	const [spineLoaded, setSpineLoaded] = useState(false);
	const [animationPlaying, setAnimationPlaying] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [scaleValue, setScaleValue] = useState(0.5);
	const [slotFilter, setSlotFilter] = useState("");
	// Доступные имена анимаций и выбранная анимация
	const [availableAnimations, setAvailableAnimations] = useState([]);
	const [selectedAnimation, setSelectedAnimation] = useState("");
	// Список слотов, к которым прикреплена графика (круг)
	const [addedSlots, setAddedSlots] = useState([]);

	// Ссылки на контейнер PIXI, экземпляр приложения и спайна
	const pixiContainerRef = useRef(null);
	const pixiAppRef = useRef(null);
	const spineInstanceRef = useRef(null);
	// Объект для хранения созданных графических элементов по слотам
	const attachedCirclesRef = useRef({});
	const filesDataRef = useRef({});

	// Обновлённые inline-стили
	const styles = {
		wrapper: {
			display: "flex",
			flexDirection: "column",
			height: "100vh",
			margin: 0,
			padding: 0,
			fontFamily: "Arial, sans-serif",
			backgroundColor: "#f2f2f2",
			boxSizing: "border-box"
		},
		header: {
			padding: "10px 20px",
			backgroundColor: "#3f51b5",
			color: "#fff",
			textAlign: "center",
			flexShrink: 0
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
			margin: "10px",
			overflow: "hidden"
		},
		controlButton: {
			padding: "8px 16px",
			marginBottom: "10px",
			border: "none",
			borderRadius: "4px",
			backgroundColor: "#3f51b5",
			color: "#fff",
			cursor: "pointer",
			alignSelf: "center"
		},
		dropZone: {
			flex: 1,
			position: "relative",
			border: "2px dashed #bbb",
			borderRadius: "8px",
			backgroundColor: "#fff",
			overflow: "hidden",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: "10px"
		},
		dropText: {
			zIndex: 2,
			color: "#666",
			textAlign: "center",
			pointerEvents: "none"
		},
		// Контейнер для канваса занимает 100% ширины и высоты родителя
		pixiContainer: {
			width: "100%",
			height: "100%",
			display: "block"
		},
		sidebar: {
			width: "300px",
			flexShrink: 0,
			margin: "10px",
			padding: "10px",
			borderRadius: "8px",
			backgroundColor: "#fff",
			boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
			overflowY: "auto"
		},
		scaleControl: {
			marginBottom: "15px"
		},
		input: {
			width: "100%",
			padding: "8px",
			marginTop: "5px",
			borderRadius: "4px",
			border: "1px solid #ccc",
			boxSizing: "border-box"
		},
		filterInput: {
			marginBottom: "10px"
		},
		slotItem: {
			marginBottom: "15px",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between"
		},
		actionButton: {
			padding: "4px 8px",
			border: "none",
			borderRadius: "4px",
			backgroundColor: "#4caf50",
			color: "#fff",
			cursor: "pointer",
			marginLeft: "5px"
		},
		removeButton: {
			padding: "4px 8px",
			border: "none",
			borderRadius: "4px",
			backgroundColor: "#f44336",
			color: "#fff",
			cursor: "pointer",
			marginLeft: "5px"
		},
		error: {
			color: "red",
			marginTop: "10px",
			textAlign: "center"
		},
		footer: {
			padding: "10px 20px",
			textAlign: "center",
			backgroundColor: "#ddd",
			flexShrink: 0
		},
		select: {
			width: "100%",
			padding: "8px",
			marginBottom: "15px",
			borderRadius: "4px",
			border: "1px solid #ccc",
			boxSizing: "border-box"
		}
	};

	// Функция обновления позиции и масштаба спайна
	const updateSpinePosition = useCallback(() => {
		if (pixiAppRef.current && spineInstanceRef.current) {
			const spine = spineInstanceRef.current;
			const bounds = spine.getLocalBounds();
			const containerWidth = pixiAppRef.current.screen.width;
			const containerHeight = pixiAppRef.current.screen.height;
			const fitScale = Math.min(
				containerWidth / bounds.width,
				containerHeight / bounds.height
			) * 0.9;
			const finalScale = Math.min(scaleValue, fitScale);
			spine.scale.set(finalScale);
			spine.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
			spine.x = containerWidth / 2;
			spine.y = containerHeight / 2;
		}
	}, [scaleValue]);

	// Инициализация PIXI-приложения
	useEffect(() => {
		if (!pixiAppRef.current && pixiContainerRef.current) {
			const app = new Application({
				width: pixiContainerRef.current.clientWidth,
				height: pixiContainerRef.current.clientHeight,
				backgroundAlpha: 0,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true
			});
			pixiContainerRef.current.appendChild(app.view);
			pixiAppRef.current = app;
		}
	}, []);

	// ResizeObserver для синхронизации размеров канваса с контейнером
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

	// Функция для обновления позиций прикреплённых графических элементов (кругов)
	const updateCircles = useCallback(() => {
		if (!spineInstanceRef.current) return;
		for (const slotName in attachedCirclesRef.current) {
			const circle = attachedCirclesRef.current[slotName];
			const slot = spineInstanceRef.current.skeleton.findSlot(slotName);
			if (slot && slot.bone) {
				// Вычисляем позицию круга как позицию кости + позиция спайна
				circle.x = spineInstanceRef.current.x + slot.bone.worldX;
				circle.y = spineInstanceRef.current.y + slot.bone.worldY;
			}
		}
	}, []);

	// Добавляем тикер для обновления графики
	useEffect(() => {
		if (pixiAppRef.current) {
			pixiAppRef.current.ticker.add(updateCircles);
			return () => {
				pixiAppRef.current.ticker.remove(updateCircles);
			};
		}
	}, [updateCircles]);

	// Обработчик изменения масштаба
	const handleScaleChange = (e) => {
		const newScale = parseFloat(e.target.value);
		setScaleValue(newScale);
		updateSpinePosition();
	};

	// Обработчик drag & drop для загрузки файлов Spine
	const onDrop = useCallback((event) => {
		event.preventDefault();
		setErrorMsg("");
		setSpineLoaded(false);
		setAnimationPlaying(false);
		setAvailableAnimations([]);
		setSelectedAnimation("");
		setAddedSlots([]);
		// Удаляем графику, если ранее что-то было добавлено
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
			setErrorMsg("Файлы не найдены");
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
			if (lower.endsWith(".json")) {
				jsonFileName = name;
			} else if (lower.endsWith(".atlas")) {
				atlasFileName = name;
			}
		}
		if (!jsonFileName || !atlasFileName) {
			setErrorMsg("Не найдены необходимые файлы: JSON и ATLAS");
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
					console.error("Ошибка при разборе JSON файла:", err);
					setErrorMsg("Ошибка при разборе JSON файла: " + err.message);
				}
			}
		};
		readerJSON.onerror = (err) => {
			console.error("Ошибка при чтении JSON файла:", err);
			setErrorMsg("Ошибка при чтении JSON файла");
		};

		readerAtlas.onload = (e) => {
			atlasText = e.target.result;
			if (jsonText) {
				try {
					const jsonData = JSON.parse(jsonText);
					createSpineAnimation(jsonData, atlasText, fileURLs);
				} catch (err) {
					console.error("Ошибка при разборе JSON файла:", err);
					setErrorMsg("Ошибка при разборе JSON файла: " + err.message);
				}
			}
		};
		readerAtlas.onerror = (err) => {
			console.error("Ошибка при чтении ATLAS файла:", err);
			setErrorMsg("Ошибка при чтении ATLAS файла");
		};

		readerJSON.readAsText(filesMap[jsonFileName]);
		readerAtlas.readAsText(filesMap[atlasFileName]);
	}, [updateSpinePosition]);

	const onDragOver = useCallback((event) => {
		event.preventDefault();
	}, []);

	// Функция создания и центрирования Spine-анимации
	const createSpineAnimation = (jsonData, atlasText, fileURLs) => {
		if (!pixiAppRef.current) return;
		const modifiedAtlasText = modifyAtlasText(atlasText, fileURLs);

		function getTextureForLine(line, fileURLs) {
			if (fileURLs[line]) {
				return BaseTexture.from(fileURLs[line]);
			}
			const lowerLine = line.toLowerCase();
			for (const key in fileURLs) {
				if (key.toLowerCase() === lowerLine) {
					return BaseTexture.from(fileURLs[key]);
				}
			}
			return null;
		}

		try {
			const spineAtlas = new TextureAtlas(modifiedAtlasText, (line, callback) => {
				const texture = getTextureForLine(line, fileURLs);
				if (texture) {
					callback(texture);
				} else {
					console.error("Не найдена текстура для строки:", line);
					callback(null);
				}
			});

			const atlasLoader = new AtlasAttachmentLoader(spineAtlas);
			const skeletonJson = new SkeletonJson(atlasLoader);
			const skeletonData = skeletonJson.readSkeletonData(jsonData);

			// Создаём экземпляр Spine
			const spineAnimation = new Spine(skeletonData);
			spineAnimation.scale.set(scaleValue);
			const bounds = spineAnimation.getLocalBounds();
			spineAnimation.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
			spineAnimation.x = pixiAppRef.current.screen.width / 2;
			spineAnimation.y = pixiAppRef.current.screen.height / 2;

			// Отключаем отладочные режимы
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

			// Запускаем первую анимацию по умолчанию
			if (skeletonData.animations.length > 0) {
				const animName = skeletonData.animations[0].name;
				spineAnimation.state.setAnimation(0, animName, true);
				setAnimationPlaying(true);
				setAvailableAnimations(skeletonData.animations.map(anim => anim.name));
				setSelectedAnimation(animName);
			}
			setSpineLoaded(true);
			updateSpinePosition();
		} catch (err) {
			console.error("Ошибка при создании Spine-анимации:", err);
			setErrorMsg("Ошибка при создании Spine-анимации: " + err.message);
		}
	};

	// Переключение воспроизведения (пауза/воспроизведение)
	const toggleAnimation = () => {
		if (!spineInstanceRef.current) return;
		const state = spineInstanceRef.current.state;
		if (animationPlaying) {
			state.timeScale = 0;
			setAnimationPlaying(false);
		} else {
			state.timeScale = 1;
			setAnimationPlaying(true);
		}
	};

	// При выборе другой анимации из выпадающего списка
	const handleAnimationSelect = (e) => {
		const animName = e.target.value;
		setSelectedAnimation(animName);
		if (spineInstanceRef.current) {
			spineInstanceRef.current.state.setAnimation(0, animName, true);
		}
	};

	// Функции для добавления/удаления графики (яркий круг) в слот

	const addCircleToSlot = (slotName) => {
		if (!spineInstanceRef.current) return;
		if (attachedCirclesRef.current[slotName]) return; // Уже добавлено

		// Создаём круг: яркий (например, красный) с радиусом 10
		const circle = new Graphics();
		circle.beginFill(0xff0000);
		circle.drawCircle(0, 0, 10);
		circle.endFill();

		// Добавляем круг как дочерний элемент спайна
		spineInstanceRef.current.addChild(circle);
		attachedCirclesRef.current[slotName] = circle;
		setAddedSlots(prev => [...prev, slotName]);
	};

	const removeCircleFromSlot = (slotName) => {
		if (!spineInstanceRef.current) return;
		const circle = attachedCirclesRef.current[slotName];
		if (circle) {
			spineInstanceRef.current.removeChild(circle);
			circle.destroy();
			delete attachedCirclesRef.current[slotName];
			setAddedSlots(prev => prev.filter(name => name !== slotName));
		}
	};

	// Фильтруем слоты по введённому фильтру. Для примера берем имена слотов из skeleton
	const filteredSlotNames = spineInstanceRef.current
		? spineInstanceRef.current.skeleton.slots
			.map(slot => slot.data.name)
			.filter(slotName =>
				slotName.toLowerCase().includes(slotFilter.toLowerCase())
			)
		: [];

	return (
		<div style={styles.wrapper}>
			<header style={styles.header}>
				<h1>Spine Tool</h1>
			</header>
			<div style={styles.mainContent}>
				<div style={styles.leftColumn}>
					{spineLoaded && (
						<>
							<button style={styles.controlButton} onClick={toggleAnimation}>
								{animationPlaying ? "Пауза" : "Воспроизвести"}
							</button>
							{/* Выпадающий список с анимациями */}
							{availableAnimations.length > 0 && (
								<select
									style={styles.select}
									value={selectedAnimation}
									onChange={handleAnimationSelect}
								>
									{availableAnimations.map((animName, idx) => (
										<option key={idx} value={animName}>
											{animName}
										</option>
									))}
								</select>
							)}
						</>
					)}
					<div style={styles.dropZone} onDrop={onDrop} onDragOver={onDragOver}>
						{!spineLoaded && (
							<p style={styles.dropText}>
								Перетащите файлы Spine (JSON, ATLAS, изображения) сюда
							</p>
						)}
						<div ref={pixiContainerRef} style={styles.pixiContainer} />
						{errorMsg && <p style={styles.error}>{errorMsg}</p>}
					</div>
				</div>
				<div style={styles.sidebar}>
					<h2>Слоты</h2>
					<input
						type="text"
						placeholder="Фильтр по слотам"
						value={slotFilter}
						onChange={(e) => setSlotFilter(e.target.value)}
						style={{ ...styles.input, ...styles.filterInput }}
					/>
					{/* Возможность изменения масштаба */}
					<div style={styles.scaleControl}>
						<label>Масштаб: {scaleValue.toFixed(2)}</label>
						<input
							type="range"
							min="0.1"
							max="2"
							step="0.01"
							value={scaleValue}
							onChange={handleScaleChange}
							style={{ width: "100%" }}
						/>
					</div>
					{/* Список всех слотов (отфильтрованных) */}
					{spineLoaded && filteredSlotNames.length > 0 ? (
						filteredSlotNames.map((slotName, idx) => (
							<div key={idx} style={styles.slotItem}>
								<span>{slotName}</span>
								{addedSlots.includes(slotName) ? (
									<button
										style={styles.removeButton}
										onClick={() => removeCircleFromSlot(slotName)}
									>
										Удалить круг
									</button>
								) : (
									<button
										style={styles.actionButton}
										onClick={() => addCircleToSlot(slotName)}
									>
										Добавить круг
									</button>
								)}
							</div>
						))
					) : (
						<p>Нет слотов для отображения</p>
					)}
					{/* Дополнительно: список слотов, в которые уже добавлен круг */}
					{addedSlots.length > 0 && (
						<>
							<h3>Прикреплено</h3>
							{addedSlots.map((slotName, idx) => (
								<div key={idx} style={styles.slotItem}>
									<span>{slotName}</span>
									<button
										style={styles.removeButton}
										onClick={() => removeCircleFromSlot(slotName)}
									>
										Удалить
									</button>
								</div>
							))}
						</>
					)}
				</div>
			</div>
			<footer style={styles.footer}>
				<small>Spine Tool demo &copy; 2025</small>
			</footer>
		</div>
	);
}

export default App;