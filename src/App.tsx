import {
  InputNumber,
  Form,
  Space,
  Button,
  Typography,
  message,
  ConfigProvider,
  Modal,
  Layout,
  Collapse,
} from "antd";

import styles from "./styles.module.scss";
import "antd/lib/style/index";
import "./App.css";
import { useEffect, useState } from "react";

const { Title } = Typography;

const App = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [tradeType, setTradeType] = useState<"Long" | "Short">("Long");

  const [currentStoredValues, setCurrentStoredValues] = useState<{
    quantity: number | undefined;
    risk: number | undefined;
    profit: number | undefined;
    takeProfit: number | undefined;
    riskRatio: number | undefined;
    portfolioRiskPercentage: number | undefined;
    portfolioBalance: number | undefined;
  }>({
    quantity: undefined,
    risk: undefined,
    profit: undefined,
    takeProfit: undefined,
    riskRatio: undefined,
    portfolioRiskPercentage: undefined,
    portfolioBalance: undefined,
  });

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getStoredValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCopiedSuccessToast = () => {
    messageApi.open({
      type: "success",
      content: "!הערך הועתק",
    });
  };

  const getStoredValues = () => {
    const riskRatio = localStorage.getItem("risk-ratio");
    const balance = localStorage.getItem("balance");
    const riskPercentage = localStorage.getItem("risk-percentage");

    setIsSettingsOpen(!riskRatio || !balance || !riskPercentage);

    setCurrentStoredValues({
      ...currentStoredValues,
      riskRatio: riskRatio ? +riskRatio : undefined,
      portfolioBalance: balance ? +balance : undefined!,
      portfolioRiskPercentage: riskPercentage ? +riskPercentage : undefined,
    });
  };

  const handleOnInvalid = () => {
    setIsSettingsOpen(true);
  };

  const handleOnCalculate = () => {
    const entryPrice = form.getFieldValue("entry-price");
    // Getters
    const balance = form.getFieldValue("balance");
    const portfolioRiskPercentage = form.getFieldValue("risk-percentage");
    const stopLoss = form.getFieldValue("stop-loss");
    const riskRatio = form.getFieldValue("risk-ratio-left");

    // Set Trade type
    setTradeType(stopLoss < entryPrice ? "Long" : "Short");

    // Validation
    if (stopLoss === entryPrice) {
      return showFormError("מחיר סטופ לוס ומחיר כניסה לא יכולים להיות שווים");
    }

    // Calculations
    const portfolioRiskAmount = (portfolioRiskPercentage / 100) * balance;
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const numberOfShares = Math.floor(portfolioRiskAmount / riskPerShare);
    const totalRisk = numberOfShares * riskPerShare;

    // Validation
    if (!numberOfShares) {
      return showFormError("כמות המניות/המטבעות המחושבת לקניה הינה: 0");
    }

    // Set state
    setCurrentStoredValues({
      ...currentStoredValues,
      quantity: numberOfShares,
      risk: totalRisk,
      profit: riskRatio * totalRisk,
      takeProfit:
        stopLoss < entryPrice
          ? entryPrice + riskPerShare * riskRatio
          : entryPrice - riskPerShare * riskRatio,
    });

    // Local storage save
    localStorage.setItem("risk-ratio", riskRatio);
    localStorage.setItem("risk-percentage", portfolioRiskPercentage);
    localStorage.setItem("balance", balance);

    setIsSettingsOpen(false);
    setIsModalOpen(true);
  };

  const handleOnClear = () => {
    form.resetFields();
  };

  const formatNumberToAmount = (value: number | undefined) => {
    if (!value) return "";
    return `$${value ? Math.round((value as number) * 100) / 100 : ""}`;
  };

  const copyToClipboard = async (value: number | undefined | string) => {
    if (value) {
      await navigator.clipboard.writeText(value.toString());
      showCopiedSuccessToast();
    }
  };

  const showFormError = (text: string) => {
    messageApi.open({
      type: "warning",
      content: text,
    });
  };

  const handleCollapseChange = (activeKeys: string | string[]) => {
    setIsSettingsOpen(activeKeys.includes("1"));
  };

  return (
    <Layout className={styles.wrapper}>
      <ConfigProvider direction="rtl">
        {contextHolder}

        <Form
          form={form}
          name="roundedForm"
          onFinish={handleOnCalculate}
          onFinishFailed={handleOnInvalid}
          layout="vertical"
          className={styles.formContainer}
        >
          <Title className={styles.title} level={4}>
            ניהול סיכונים - חישוב עסקה
          </Title>
          <Space className={styles.container}>
            {/* Right Side */}
            <Space className={styles.rightSideContainer}>
              <Form.Item
                label="מחיר כניסה"
                name="entry-price"
                rules={[{ required: true, message: "הכנס מחיר " }]}
              >
                <InputNumber
                  min={0}
                  max={10_000}
                  className={styles.activeInput}
                />
              </Form.Item>

              <Form.Item
                label="Stop loss"
                name="stop-loss"
                rules={[{ required: true, message: "הכנס מחיר" }]}
              >
                <InputNumber min={0} className={styles.activeInput} />
              </Form.Item>

              <Collapse
                className={styles.collapseContainer}
                size="small"
                onChange={handleCollapseChange}
                activeKey={[isSettingsOpen ? "1" : ""]}
                items={[
                  {
                    key: "1",
                    label: "הגדרות שמורות",
                    children: (
                      <>
                        <Form.Item
                          label="יחס סיכוי/סיכון"
                          className={styles.riskContainer}
                        >
                          <Space align="baseline">
                            <Form.Item
                              name="risk-ratio-left"
                              rules={[{ required: true, message: "הכנס יחס" }]}
                              initialValue={localStorage.getItem("risk-ratio")}
                            >
                              <InputNumber
                                min={1}
                                max={10}
                                step={0.5}
                                style={{ width: "100%" }}
                                value={currentStoredValues.riskRatio}
                                className={styles.innerInput}
                              />
                            </Form.Item>
                            <span style={{ color: "#eeeeee" }}>:</span>
                            <Form.Item name="risk-ratio-right" initialValue={1}>
                              <InputNumber
                                disabled
                                style={{ width: "100%" }}
                                className={styles.innerInput}
                              />
                            </Form.Item>
                          </Space>
                        </Form.Item>

                        <Form.Item
                          label="אחוז הסיכון ביחס לתיק"
                          name="risk-percentage"
                          rules={[{ required: true, message: "הכנס ערך" }]}
                          initialValue={localStorage.getItem("risk-percentage")}
                        >
                          <InputNumber
                            min={1}
                            max={10}
                            step={1}
                            formatter={(value) => (value ? `${value}%` : "")}
                            style={{ width: "100%" }}
                            value={currentStoredValues.portfolioRiskPercentage}
                            className={styles.innerInput}
                          />
                        </Form.Item>

                        <Form.Item
                          label="סך תיק ההשקעות"
                          name="balance"
                          initialValue={localStorage.getItem("balance")}
                          rules={[
                            {
                              required: true,
                              message: "הכנס את היתרה הנוכחית בתיק",
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            max={1_000_000_000}
                            style={{ width: "100%" }}
                            formatter={(value) => formatNumberToAmount(value)}
                            value={currentStoredValues.portfolioBalance}
                            className={styles.innerInput}
                          />
                        </Form.Item>
                      </>
                    ),
                  },
                ]}
              />
            </Space>
          </Space>
          {/* Button */}
          <div className={styles.buttonContainer}>
            <Button
              type="primary"
              size="large"
              shape="round"
              htmlType="submit"
              style={{ width: "10rem", fontWeight: "500" }}
            >
              חשב
            </Button>
            <Button
              type="text"
              htmlType="reset"
              size="small"
              style={{
                color: "gray",
                backgroundColor: "transparent",
                border: "none",
              }}
              onClick={handleOnClear}
            >
              נקה
            </Button>
          </div>

          <span
            style={{ color: "#5a5967", padding: "0.5rem", fontSize: "12px" }}
          >
            All rights reserved to Gal Aharon Web Development.
          </span>
        </Form>

        <Modal
          title="נתוני עסקה"
          maskClosable={false}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          centered
          footer={null}
        >
          <Space className={styles.formItemGroupContainer}>
            <span>סוג עסקה:</span>
            <Button
              type="link"
              className={styles.iconButton}
              style={{
                color: tradeType === "Long" ? "#1677FF" : "red",
                fontWeight: 500,
              }}
              onClick={() => {
                copyToClipboard(tradeType);
              }}
            >
              {tradeType}
            </Button>
          </Space>

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Space direction="vertical" style={{ rowGap: 0 }}>
              <Space className={styles.formItemGroupContainer}>
                <span>כמות לקניה:</span>
                {currentStoredValues.quantity && (
                  <Button
                    type="link"
                    size="small"
                    className={styles.iconButton}
                    onClick={() => {
                      copyToClipboard(currentStoredValues.quantity);
                    }}
                  >
                    {currentStoredValues.quantity}
                  </Button>
                )}
              </Space>

              <Space className={styles.formItemGroupContainer}>
                <span>יעד הרווח הראשוני (TP):</span>
                {currentStoredValues.takeProfit && (
                  <Button
                    type="link"
                    size="small"
                    className={styles.iconButton}
                    onClick={() => {
                      copyToClipboard(currentStoredValues.takeProfit);
                    }}
                  >
                    {formatNumberToAmount(currentStoredValues.takeProfit)}
                  </Button>
                )}
              </Space>
            </Space>

            <Space direction="vertical" style={{ rowGap: 0 }}>
              <Space className={styles.formItemGroupContainer}>
                <span>סה"כ סיכון:</span>

                {currentStoredValues.risk && (
                  <Button
                    type="link"
                    size="small"
                    className={styles.iconButton}
                    onClick={() => {
                      copyToClipboard(currentStoredValues.risk);
                    }}
                  >
                    {formatNumberToAmount(currentStoredValues.risk)}
                  </Button>
                )}
              </Space>

              <Space className={styles.formItemGroupContainer}>
                <span>סה"כ רווח:</span>

                {currentStoredValues.profit && (
                  <Button
                    type="link"
                    size="small"
                    className={styles.iconButton}
                    onClick={() => {
                      copyToClipboard(currentStoredValues.profit);
                    }}
                  >
                    {formatNumberToAmount(currentStoredValues.profit)}
                  </Button>
                )}
              </Space>
            </Space>
          </Space>
        </Modal>
      </ConfigProvider>
    </Layout>
  );
};

export default App;
