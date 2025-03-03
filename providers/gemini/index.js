"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
function transformMessages(messages) {
    return messages.map(function (message) { return ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content || '' }]
    }); });
}
var Gemini = /** @class */ (function () {
    function Gemini(model, device_map, apiKey, apiEndpoint) {
        if (model === void 0) { model = null; }
        if (device_map === void 0) { device_map = null; }
        if (apiKey === void 0) { apiKey = null; }
        if (apiEndpoint === void 0) { apiEndpoint = null; }
        this.chatModels = ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.0-pro"];
        this.model = model || "gemini-2.0-flash";
        this.device_map = device_map;
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint !== null && apiEndpoint !== void 0 ? apiEndpoint : "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/google-ai-studio";
        this.provider = "gemini";
    }
    Gemini.prototype.createCompletion = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, modelName, requestBody, response, errorMessage, error_1, error_2;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            return __generator(this, function (_r) {
                switch (_r.label) {
                    case 0:
                        _r.trys.push([0, 5, , 6]);
                        if (!this.apiKey) {
                            throw new Error('API key is required for Gemini');
                        }
                        if (!options.messages || options.messages.length === 0) {
                            throw new Error('At least one message is required');
                        }
                        headers = {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(this.apiKey)
                        };
                        modelName = options.model || this.model || "gemini-2.0-flash";
                        requestBody = {
                            contents: transformMessages(options.messages),
                            safetySettings: [
                                {
                                    category: "HARM_CATEGORY_HARASSMENT",
                                    threshold: "BLOCK_NONE"
                                },
                                {
                                    category: "HARM_CATEGORY_HATE_SPEECH",
                                    threshold: "BLOCK_NONE"
                                },
                                {
                                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                    threshold: "BLOCK_NONE"
                                },
                                {
                                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                    threshold: "BLOCK_NONE"
                                }
                            ],
                            generationConfig: {
                                temperature: options.temperature || 0.7,
                                topP: options.top_p || 1,
                                maxOutputTokens: options.max_tokens || 1024,
                                topK: 40,
                                stopSequences: []
                            }
                        };
                        _r.label = 1;
                    case 1:
                        _r.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.post("".concat(this.apiEndpoint, "/models/").concat(modelName, ":generateContent"), requestBody, {
                                headers: headers,
                                validateStatus: function (status) { return status < 500; } // Don't throw on 4xx errors
                            })];
                    case 2:
                        response = _r.sent();
                        if (response.status === 401 || response.status === 403) {
                            throw new Error('Invalid API key');
                        }
                        if (response.status === 404) {
                            // Check if it's a model not found error
                            if (!this.chatModels.includes(modelName)) {
                                throw new Error("Model ".concat(modelName, " not found. Available models: ").concat(this.chatModels.join(', ')));
                            }
                            throw new Error("Model ".concat(modelName, " not found"));
                        }
                        if (response.status !== 200) {
                            errorMessage = ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error';
                            if (errorMessage.includes('invalid api key') || errorMessage.includes('unauthorized')) {
                                throw new Error('Invalid API key');
                            }
                            throw new Error("Request failed with status ".concat(response.status, ": ").concat(errorMessage));
                        }
                        if (!response.data) {
                            throw new Error('Empty response from API');
                        }
                        // Transform Gemini response to standard format
                        return [2 /*return*/, {
                                id: "gemini-".concat(Date.now()),
                                object: 'chat.completion',
                                created: Date.now(),
                                model: modelName,
                                choices: [{
                                        index: 0,
                                        message: {
                                            role: 'assistant',
                                            content: ((_g = (_f = (_e = (_d = (_c = response.data.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.parts) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.text) || ''
                                        },
                                        finish_reason: ((_j = (_h = response.data.candidates) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.finishReason) || 'stop'
                                    }],
                                usage: {
                                    prompt_tokens: ((_k = response.data.usageMetadata) === null || _k === void 0 ? void 0 : _k.promptTokenCount) || 0,
                                    completion_tokens: ((_l = response.data.usageMetadata) === null || _l === void 0 ? void 0 : _l.candidatesTokenCount) || 0,
                                    total_tokens: (((_m = response.data.usageMetadata) === null || _m === void 0 ? void 0 : _m.promptTokenCount) || 0) + (((_o = response.data.usageMetadata) === null || _o === void 0 ? void 0 : _o.candidatesTokenCount) || 0)
                                }
                            }];
                    case 3:
                        error_1 = _r.sent();
                        if (((_p = error_1.response) === null || _p === void 0 ? void 0 : _p.status) === 401 || ((_q = error_1.response) === null || _q === void 0 ? void 0 : _q.status) === 403 || error_1.message.includes('invalid api key') || error_1.message.includes('unauthorized')) {
                            throw new Error('Invalid API key');
                        }
                        throw error_1;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _r.sent();
                        if (error_2 instanceof Error) {
                            throw error_2;
                        }
                        throw new Error('Unknown error occurred');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Gemini.prototype.getProviders = function () {
        return [{
                id: 7,
                logo: "gemini-logo.png",
                name: "gemini",
                apiUrl: this.apiEndpoint || "https://gateway.ai.cloudflare.com/v1/8073e84dbfc4e2bc95666192dcee62c0/codebolt/google-ai-studio",
                keyAdded: !!this.apiKey,
                category: 'cloudProviders'
            }];
    };
    Gemini.prototype.getModels = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.chatModels.map(function (model) { return ({
                        id: model,
                        name: model,
                        provider: 'gemini',
                        type: 'chat'
                    }); })];
            });
        });
    };
    return Gemini;
}());
exports.default = Gemini;
