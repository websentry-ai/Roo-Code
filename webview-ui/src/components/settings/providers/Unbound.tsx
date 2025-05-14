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
	const queryClient = useQueryClient()

	const handleInputChange = useCallback(
		<K extends keyof ApiConfiguration, E>(
			field: K,
			transform: (event: E) => ApiConfiguration[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	const handleRefresh = useCallback(async () => {
		vscode.postMessage({
			type: "upsertApiConfiguration",
			text: "default",
			apiConfiguration: apiConfiguration,
		})

		const waitForStateUpdate = new Promise<void>((resolve) => {
			const messageHandler = (event: MessageEvent) => {
				const message = event.data
				if (message.type === "state") {
					window.removeEventListener("message", messageHandler)
					resolve()
				}
			}
			window.addEventListener("message", messageHandler)
		})

		await waitForStateUpdate

		vscode.postMessage({ type: "flushRouterModels", text: "unbound" })
		vscode.postMessage({ type: "requestRouterModels", text: "unbound" })

		await queryClient.invalidateQueries({ queryKey: ["routerModels"] })

		setDidRefetch(true)

		setTimeout(() => setDidRefetch(false), 2000)
	}, [queryClient, apiConfiguration])

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
			<div className="flex justify-end">
				<Button variant="outline" onClick={handleRefresh} className="w-1/2 max-w-xs">
					<div className="flex items-center gap-2 justify-center">
						<span className="codicon codicon-refresh" />
						{t("settings:providers.refreshModels.label")}
					</div>
				</Button>
			</div>
			{didRefetch && (
				<div className="flex items-center text-vscode-gitDecoration-addedResourceForeground">
					{t("settings:providers.refreshModels.success", {
						defaultValue: "Models list updated! You can now select from the latest models.",
					})}
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
