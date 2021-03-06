/*global chrome*/
/*global browser*/

import React from 'react';
import {Form, Input, InputNumber, Button} from 'antd';

const API = browser || chrome;

class FormPreferences extends React.Component {
    state = {
        dirty: false,
        success: false,
        error: null,
        initialVacationDays: 20,
        initialWorkReductionHours: 16*8,
        initialVacationRegex: 'ferie',
        initialReductionRegex: 'permesso|rol',
    };

    componentDidMount() {
        if (API !== window) {
            API.storage.sync.get(['vacationDays','workReductionHours','vacationRegex','reductionRegex']).then((data) => {
                this.setState({
                    initialVacationDays: data.hasOwnProperty('vacationDays') ? data.vacationDays : this.state.initialVacationDays,
                    initialWorkReductionHours: data.hasOwnProperty('workReductionHours') ? data.workReductionHours : this.state.initialWorkReductionHours,
                    initialVacationRegex: data.hasOwnProperty('vacationRegex') ? data.vacationRegex : this.state.initialVacationRegex,
                    initialReductionRegex: data.hasOwnProperty('reductionRegex') ? data.reductionRegex : this.state.initialReductionRegex,
                });
            }).catch((error) => {
                console.error('componentDidMount', error);
            });
        }
    }

    handleSubmit = (values) => {
        console.log('Received values: ', values);
        try {
            API.storage.sync.set(values).then(() => {
                this.setState({success: true});
                this.sendRefreshMessage();
            }).catch((error) => {
                this.setState({error});
            });
        } catch (error) {
            this.setState({error});
        }
    };

    refreshDelay = 500;
    sendRefreshMessage() {
        API.tabs.query({url: '*://*/*verse*'}).then((tabs) => {
            for (const tab of tabs) {
                setTimeout(() => {
                    API.tabs.sendMessage(tab.id, {refresh: true, tab: tab.id});
                }, this.refreshDelay);
            }
        }).catch((error) => {
            console.error('react sendRefreshMessage', error);
        });
    }

    onChange = () => {
        this.setState({
            dirty: true,
            success: false,
            error: null,
        });
    };

    render() {
        const { dirty, success, error,
            initialVacationDays, initialWorkReductionHours,
            initialVacationRegex, initialReductionRegex } = this.state;

        const formItemLayout = {
            labelCol: {
                xs: { span: 12 },
                sm: { span: 12 },
            },
            wrapperCol: {
                xs: { span: 12 },
                sm: { span: 12 },
            },
        };
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 0,
                },
                sm: {
                    span: 24,
                    offset: 0,
                },
            },
        };

        return (
            <Form {...formItemLayout} onFinish={this.handleSubmit}>
                <Form.Item label="Total Vacation days">
                    <Form.Item name="vacationDays" noStyle initialValue={initialVacationDays}
                               rules={[{required: true, message: 'Please input your total Vacation days!'}]}>
                        <InputNumber min={0} step={0.5} precision={1} onChange={this.onChange} />
                    </Form.Item>
                </Form.Item>
                <Form.Item label="Total Work Reduction hours">
                    <Form.Item name="workReductionHours" noStyle initialValue={initialWorkReductionHours}
                               rules={[{required: true, message: 'Please input your total Work Reduction hours!'}]}>
                        <InputNumber min={0} step={1} precision={0} onChange={this.onChange} />
                    </Form.Item>
                </Form.Item>
                <Form.Item label="Vacation label">
                    <Form.Item name="vacationRegex" noStyle initialValue={initialVacationRegex}
                               rules={[{required: true, message: 'Please input your Vacation label!'}]}>
                        <Input onChange={this.onChange} />
                    </Form.Item>
                </Form.Item>
                <Form.Item label="Work Reduction label">
                    <Form.Item name="reductionRegex" noStyle initialValue={initialReductionRegex}
                               rules={[{required: true, message: 'Please input your Work Reduction label!'}]}>
                        <Input onChange={this.onChange} />
                    </Form.Item>
                </Form.Item>
                <Form.Item {...tailFormItemLayout} className="center">
                    <Button disabled={!dirty} type="primary" htmlType="submit">Save</Button>
                </Form.Item>
                <div className="center">
                    {success ? <span className="bold green">Values successfully saved.</span> : null}
                    {error ? <span className="bold red">An error has occurred. {error.message}</span> : null}
                </div>
            </Form>
        );
    }
}

export default FormPreferences;