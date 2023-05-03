import React, { useEffect, useRef, useState } from "react"
import { ErrorBoundaryProps, Redirect, Stack, useRouter } from "expo-router"
import { observer } from "mobx-react-lite"

import { Screen, Content } from "@common-ui/components/Screen"
import { MediumText } from "@common-ui/components/Text"
import { ErrorDetails } from "@components/ErrorDetails"
import TitleWithBackButton from "@components/TitleWithBackButton"
import { ROUTES } from "app/_layout"
import { Spacing } from "@common-ui/constants/spacing"
import { Card, CardContent, CardFooter } from "@common-ui/components/Card"
import { Cell, Row, RowOrCell } from "@common-ui/components/Common"
import { Input } from "@common-ui/components/Input"
import CheckBoxItem from "@common-ui/components/CheckBoxItem"
import { OutlinedButton, SolidButton } from "@common-ui/components/Button"
import { useStores } from "@models/helpers/useStores"
import { If } from "@common-ui/components/Conditional"
import ErrorMessage from "@common-ui/components/ErrorMessage"
import Config from "@config/config"
import GoogleRecaptcha from "@components/GoogleRecaptcha"
import GoogleSigninButton from "@components/GoogleSigninButton"
import { useLocale } from "@common-ui/contexts/LocaleContext"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

const NewScreen = observer(
  function NewScreen() {
    const router = useRouter()
    const { t } = useLocale();
    const { authSessionStore } = useStores()

    const recaptcha = useRef(null)

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    const [rememberMe, setRememberMe] = useState(true)

    const [validationError, setValidationError] = useState<string>("")
    const [isValid, setIsValid] = useState<boolean>(false)

    // Clear any errors when the screen is loaded
    useEffect(() => {
      authSessionStore.clearDataFetching()
    }, [])

    useEffect(() => {
      let isValid = true
      setValidationError("")

      // Validate Password
      if (password && password.length < Config.PASSWORD_MIN_LENGTH) {
        isValid = false
        setValidationError(t("validations.passwordLength", { length: Config.PASSWORD_MIN_LENGTH }))
      }

      // Validate Password Confirmation
      if (password && passwordConfirmation && passwordConfirmation !== password) {
        isValid = false
        setValidationError(t("validations.passwordsDontMatch"))
      }

      // Validate Presence
      if (!firstName || !lastName || !email || !password) {
        isValid = false
      }

      setIsValid(isValid)
    }, [firstName, lastName, email, password, passwordConfirmation])

    // If the user is already logged in, redirect them to the home screen
    if (authSessionStore.isLoggedIn) {
      return <Redirect href={ROUTES.UserAlerts} />
    }

    const loginUser = () => {
      router.push({ pathname: ROUTES.UserLogin })
    }

    const createAccount = async (captchaToken: string) => {
      await authSessionStore.createAccount({
        firstName,
        lastName,
        username: email,
        phone: "",
        password,
        rememberMe,
        captchaToken,
      })

      recaptcha.current?.reset();
    }

    const submit = () => {
      setValidationError("")

      if (!isValid) return

      recaptcha.current?.reset();
      recaptcha.current?.open();
    }

    const onVerify = (captchaToken: string) => {
      createAccount(captchaToken)
    }
    
    // This is called when the recaptcha expires
    const onExpire = () => {
      recaptcha.current?.open();
    }

    const goBack = () => {
      router.push({ pathname: ROUTES.About })
    }

    const errorMessage = validationError || authSessionStore.errorMessage
    
    return (
      <Screen>
        <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
        <TitleWithBackButton
          title={t("navigation.newAccountScreen")}
          onPress={goBack}
        />
        <Content maxWidth={Spacing.tabletWidth} scrollable>
          <Card bottom={Spacing.large}>
            <GoogleRecaptcha
              ref={recaptcha}
              onVerify={onVerify}
              onExpire={onExpire}
            />
            <CardContent>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>{t("newScreen.firstName")}</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    placeholder={t("newScreen.firstNamePlaceholder")}
                    onChangeText={setFirstName}
                  />
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>{t("newScreen.lastName")}</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    placeholder={t("newScreen.lastNamePlaceholder")}
                    onChangeText={setLastName}
                  />
                </Cell>
              </RowOrCell>
              <RowOrCell bottom={Spacing.small}>
                <Cell flex={1}>
                  <MediumText>{t("newScreen.email")}</MediumText>
                </Cell>
                <Cell flex={5}>
                  <Input
                    value=""
                    keyboardType="email-address"
                    placeholder={t("newScreen.emailPlaceholder")}
                    onChangeText={setEmail}
                  />
                </Cell>
              </RowOrCell>
              <Cell>
                <RowOrCell bottom={Spacing.small}>
                  <Cell flex={1}>
                    <MediumText>{t("newScreen.password")}</MediumText>
                  </Cell>
                  <Cell flex={5}>
                    <Input
                      value=""
                      secureTextEntry
                      placeholder={t("newScreen.passwordPlaceholder")}
                      onChangeText={setPassword}
                    />
                  </Cell>
                </RowOrCell>
              </Cell>
              <Cell>
                <RowOrCell bottom={Spacing.small}>
                  <Cell flex={1}>
                    <MediumText>{t("newScreen.confirmPassword")}</MediumText>
                  </Cell>
                  <Cell flex={5}>
                    <Input
                      value=""
                      secureTextEntry
                      placeholder={t("newScreen.confirmPasswordPlaceholder")}
                      onChangeText={setPasswordConfirmation}
                    />
                  </Cell>
                </RowOrCell>
              </Cell>
              <Cell top={Spacing.medium}>
                <CheckBoxItem
                  label={t("newScreen.rememberMe")}
                  value={rememberMe}
                  onChange={setRememberMe}
                />
              </Cell>
              <If condition={!!errorMessage}>
                <ErrorMessage errorText={errorMessage} />
              </If>
              <Row align="space-evenly" top={Spacing.small} bottom={Spacing.large}>
                <OutlinedButton
                  disabled={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("newScreen.login")}
                  onPress={loginUser}
                />
                <SolidButton
                  isLoading={authSessionStore.isFetching}
                  minWidth={Spacing.extraExtraHuge}
                  selfAlign="center"
                  title={t("newScreen.createAccount")}
                  onPress={submit}
                />
              </Row>
            </CardContent>
            <CardFooter>
              <GoogleSigninButton />
            </CardFooter>
          </Card>
        </Content>
      </Screen>
    )
  }
)

export default NewScreen
