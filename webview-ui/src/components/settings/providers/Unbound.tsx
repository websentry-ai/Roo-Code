import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import { ApiConfiguration, RouterModels, unboundDefaultModelId } from "@roo/shared/api"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { vscode } from "@src/utils/vscode"

import { inputEventTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"

type UnboundProps = {
	apiConfiguration: ApiConfiguration
	setApiConfigurationField: (field: keyof ApiConfiguration, value: ApiConfiguration[keyof ApiConfiguration]) => void
	routerModels?: RouterModels
	refetchRouterModels: () => void
}

export const Unbound = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	refetchRouterModels,
}: UnboundProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ApiConfiguration, E>(
			field: K,
			transform: (event: E) => ApiConfiguration[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				const newValue = transform(event as E)
				setApiConfigurationField(field, newValue)
				vscode.postMessage({
					type: "requestRouterModels",
					text: "unbound",
					values: { unboundApiKey: newValue },
				})
				setTimeout(() => {
					refetchRouterModels()
				}, 100)
			},
		[setApiConfigurationField, refetchRouterModels],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.unboundApiKey || ""}
				type="password"
				onInput={handleInputChange("unboundApiKey")}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.unboundApiKey")}</label>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!apiConfiguration?.unboundApiKey && (
				<VSCodeButtonLink href="https://gateway.getunbound.ai" appearance="secondary">
					{t("settings:providers.getUnboundApiKey")}
				</VSCodeButtonLink>
			)}
			<ModelPicker
				apiConfiguration={apiConfiguration}
				defaultModelId={unboundDefaultModelId}
				models={routerModels?.unbound ?? {}}
				modelIdKey="unboundModelId"
				serviceName="Unbound"
				serviceUrl="https://api.getunbound.ai/models"
				setApiConfigurationField={setApiConfigurationField}
			/>
		</>
	)
}
