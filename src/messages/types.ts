export type Locale = "en-US" | "zh-CN";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en-US", "zh-CN"] as const;

export const DEFAULT_LOCALE: Locale = "en-US";

export type Messages = {
	cli: {
		description: string;
		apiKeyOption: string;
		baseUrlOption: string;
		verboseOption: string;
		langOption: string;
	};
	auth: {
		description: string;
		setDescription: string;
		getDescription: string;
		loginDescription: string;
		localOption: string;
		loginSuccess: string;
		logoutDescription: string;
		logoutSuccess: string;
		logoutNothing: string;
		logoutEnvWarning: string;
		notConfigured: string;
		noApiKey: string;
		noApiKeyExit: string;
	};
	tools: {
		namespaceDescription: string;
		listDescription: string;
		describeDescription: string;
		toolNotFound: (name: string) => string;
		statusDescription: string;
		statusWaitOption: string;
		statusTimeoutOption: string;
		statusToolOption: string;
		runInputOption: string;
		runDryRunOption: string;
		runNoWaitOption: string;
		runTimeoutOption: string;
		inputValidationFailed: string;
		estimatedCost: (credits: number) => string;
		estimatedDuration: (seconds: number) => string;
	};
	input: {
		inputFileNotFound: (path: string) => string;
		invalidJson: (error: string) => string;
		inputMustBeObject: string;
		fileNotFound: (label: string, path: string) => string;
		fileTooLarge: (label: string, sizeMb: string, limitMb: number) => string;
		fileSizeWarn: (label: string, sizeMb: string) => string;
		uploadFailed: (label: string, reason: string) => string;
	};
	api: {
		invoking: (modelId: string) => string;
		taskSubmitted: (generateId: string) => string;
		requestFailed: (status: number) => string;
		statusFetchFailed: (status: number) => string;
		pollFailed: (status: number) => string;
		taskDidNotComplete: (seconds: number) => string;
		playVideo: (label: string) => string;
		playAudio: (label: string) => string;
		viewDownload: (label: string) => string;
		shapesGenerated: (count: number) => string;
		taskSubmittedDisplay: (generateId: string, status: string) => string;
		generationCompleted: string;
		displayBannerStart: string;
		displayBannerEnd: string;
		displayHint: string;
	};
	config: {
		startingAuth: string;
		visitToAuthorize: (url: string) => string;
		pollingNotice: (minutes: number) => string;
		authExpired: string;
		authTimeout: (minutes: number) => string;
	};
};
