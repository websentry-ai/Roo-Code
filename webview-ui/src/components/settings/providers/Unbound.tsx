import { useCallback, useState } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useQueryClient } from "@tanstack/react-query"

import { ApiConfiguration, RouterModels, unboundDefaultModelId } from "@roo/shared/api"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { vscode } from "@src/utils/vscode"
import { Button } from "@src/components/ui"

import { inputEventTransform } from "../transforms"
import { ModelPicker } from "../ModelPicker"

type UnboundProps = {
	apiConfiguration: ApiConfiguration
	setApiConfigurationField: (field: keyof ApiConfiguration, value: ApiConfiguration[keyof ApiConfiguration]) => void
	routerModels?: RouterModels
}

export const Unbound = ({ apiConfiguration, setApiConfigurationField, routerModels }: UnboundProps) => {
	const { t } = useAppTranslation()
	const [didRefetch, setDidRefetch] = useState<boolean>()
	const [currentApiKey, setCurrentApiKey] = useState<string>(apiConfiguration?.unboundApiKey || "")
	const queryClient = useQueryClient()

	const handleInputChange = useCallback(
		<K extends keyof ApiConfiguration, E>(
			field: K,
			transform: (event: E) => ApiConfiguration[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
				setCurrentApiKey(String(transform(event as E)))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={currentApiKey}
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
			<Button
				variant="outline"
				onClick={() => {
					vscode.postMessage({ type: "flushRouterModels", text: "unbound" })
					vscode.postMessage({
						type: "requestRouterModels",
						text: "unbound",
						values: { unboundApiKey: currentApiKey },
					})
					queryClient.invalidateQueries({ queryKey: ["routerModels"] })
					setDidRefetch(true)
				}}>
				<div className="flex items-center gap-2">
					<span className="codicon codicon-refresh" />
					{t("settings:providers.refreshModels.label")}
				</div>
			</Button>
			{didRefetch && (
				<div className="flex items-center text-vscode-gitDecoration-addedResourceForeground">
					{t("settings:providers.refreshModels.hint")}
				</div>
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
