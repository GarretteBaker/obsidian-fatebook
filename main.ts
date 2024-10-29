import { App, Plugin, PluginSettingTab, Setting, Modal, Notice } from 'obsidian';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType, hoverTooltip } from '@codemirror/view';

interface MyPluginSettings {
	apiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	apiKey: ''
}

export default class FatebookPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('Loading Fatebook plugin...');
		new Notice('Fatebook plugin loaded!');
		
		await this.loadSettings();

		// Create a function to create the embed DOM element
		const createEmbed = (questionId: string) => {
			const dom = document.createElement('div');
			dom.className = 'fatebook-embed';
			
			const iframe = document.createElement('iframe');
			iframe.src = `https://fatebook.io/embed/q/${questionId}?compact=true&requireSignIn=false`;
			iframe.width = '400';
			iframe.height = '200';
			iframe.style.border = '1px solid rgba(255, 255, 255, 0.1)';
			iframe.style.borderRadius = '4px';
			iframe.style.display = 'block';
			
			// Handle load errors
			iframe.onerror = () => {
				console.error('Failed to load Fatebook embed');
			};
			
			dom.appendChild(iframe);
			return dom;
		};

		// Register for edit mode
		this.registerEditorExtension(hoverTooltip((view, pos) => {
			const line = view.state.doc.lineAt(pos);
			const linkRegex = /\[([^\]]+)\]\((https:\/\/fatebook\.io\/q\/[^)]+)\)/g;
			let match;

			while ((match = linkRegex.exec(line.text)) !== null) {
				const from = line.from + match.index;
				const to = from + match[0].length;
				
				if (pos >= from && pos <= to && match[2]) {
					const idMatch = match[2].match(/--([^)]+)$/);
					if (idMatch) {
						return {
							pos: from,
							end: to,
							above: true,
							create() {
								return { dom: createEmbed(idMatch[1]) };
							}
						};
					}
				}
			}
			return null;
		}));

		// Register for read mode
		const hoverHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const href = target.getAttribute('href');
			
			if (href?.includes('fatebook.io/q/')) {
				const idMatch = href.match(/--([^)]+)$/);
				if (idMatch && !target.querySelector('.fatebook-embed')) {
					const embed = createEmbed(idMatch[1]);
					target.appendChild(embed);

					// Remove embed when mouse leaves
					const removeEmbed = () => {
						embed.remove();
						target.removeEventListener('mouseleave', removeEmbed);
					};
					target.addEventListener('mouseleave', removeEmbed);
				}
			}
		};

		this.registerDomEvent(document, 'mouseover', hoverHandler);

		// Add a command to create a new prediction
		this.addCommand({
			id: 'create-fatebook-prediction',
			name: 'Create New Prediction',
			callback: () => {
				new PredictionModal(this.app, this).open();
			}
		});

		// Add settings tab
		this.addSettingTab(new FatebookSettingTab(this.app, this));
	}

	onunload() {
		// Event listeners registered with registerDomEvent are automatically cleaned up
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createPrediction(title: string, resolveBy: string, forecast: string): Promise<boolean> {
		if (!this.settings.apiKey) {
			new Notice('Please set your Fatebook API key in settings');
			return false;
		}

		try {
			// First create the prediction
			const createUrl = new URL('https://fatebook.io/api/v0/createQuestion');
			createUrl.searchParams.append('apiKey', this.settings.apiKey);
			createUrl.searchParams.append('title', title);
			createUrl.searchParams.append('resolveBy', resolveBy);
			createUrl.searchParams.append('forecast', forecast);

			const createResponse = await this.makeRequest(createUrl.toString());
			if (!createResponse) {
				return false;
			}

			// Then get the question details
			const getUrl = new URL('https://fatebook.io/api/v0/getQuestions');
			getUrl.searchParams.append('apiKey', this.settings.apiKey);
			getUrl.searchParams.append('limit', '1');

			const getResponse = await this.makeRequest(getUrl.toString());
			if (!getResponse) {
				return false;
			}

			const data = JSON.parse(getResponse);
			if (data.items && data.items.length > 0) {
				const question = data.items[0];
				const formattedTitle = question.title.replace(/\s+/g, '-').toLowerCase();
				const link = `https://fatebook.io/q/${formattedTitle}--${question.id}`;
				const markdownLink = `[${question.title}](${link})`;

				// Copy to clipboard
				await navigator.clipboard.writeText(markdownLink);
				new Notice('Prediction created and link copied to clipboard!');
				return true;
			}

			new Notice('Prediction created but could not get link');
			return true;
		} catch (error) {
			console.error('Full error:', error);
			new Notice(`Failed to create prediction: ${error.message}`);
			return false;
		}
	}

	private makeRequest(url: string): Promise<string | null> {
		return new Promise((resolve) => {
			// @ts-ignore
			const https = require('https');
			
			https.get(url, (resp: any) => {
				let data = '';

				resp.on('data', (chunk: any) => {
					data += chunk;
				});

				resp.on('end', () => {
					resolve(data);
				});
			}).on('error', (err: Error) => {
				console.error('Error:', err);
				new Notice(`Request failed: ${err.message}`);
				resolve(null);
			});
		});
	}
}

class PredictionModal extends Modal {
	plugin: FatebookPlugin;
	titleInput: HTMLInputElement;
	forecastInput: HTMLInputElement;
	resolveByInput: HTMLInputElement;

	constructor(app: App, plugin: FatebookPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl('h2', {text: 'Create Fatebook Prediction'});

		// Create form container
		const form = contentEl.createEl('form');
		form.onsubmit = async (e) => {
			e.preventDefault();
			await this.createPrediction();
		};

		new Setting(form)
			.setName('Question')
			.addText(text => {
				this.titleInput = text.inputEl;
				text.setPlaceholder('Will X happen by Y date?');
			});

		new Setting(form)
			.setName('Forecast (0-1)')
			.addText(text => {
				this.forecastInput = text.inputEl;
				text.setPlaceholder('0.75')
					.setValue('0.5');
			});

		new Setting(form)
			.setName('Resolve By')
			.addText(text => {
				this.resolveByInput = text.inputEl;
				text.setPlaceholder('YYYY-MM-DD');
			});

		new Setting(form)
			.addButton(btn => btn
				.setButtonText('Create Prediction')
				.onClick(() => this.createPrediction()));
	}

	async createPrediction() {
		// Validate inputs
		const forecast = parseFloat(this.forecastInput.value);
		if (isNaN(forecast) || forecast < 0 || forecast > 1) {
			new Notice('Forecast must be a number between 0 and 1');
			return;
		}

		if (!this.resolveByInput.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
			new Notice('Resolve By must be in YYYY-MM-DD format');
			return;
		}

		if (!this.titleInput.value.trim()) {
			new Notice('Question cannot be empty');
			return;
		}

		const success = await this.plugin.createPrediction(
			this.titleInput.value,
			this.resolveByInput.value,
			this.forecastInput.value
		);

		if (success) {
			this.close();
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class FatebookSettingTab extends PluginSettingTab {
	plugin: FatebookPlugin;

	constructor(app: App, plugin: FatebookPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Fatebook API Key')
			.setDesc('Enter your Fatebook API key')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
