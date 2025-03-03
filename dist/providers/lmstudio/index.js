"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const toolParser_1 = __importStar(require("./../../utils/toolParser"));
class LMStudio {
    constructor(model = null, device_map = null, apiEndpoint = null) {
        this.apiKey = null;
        this.model = model;
        this.device_map = device_map;
        this.embeddingModels = [];
        this.apiEndpoint = apiEndpoint ?? "http://localhost:1234/v1";
    }
    async createCompletion(options) {
        try {
            const response = await axios_1.default.post(`${this.apiEndpoint}/chat/completions`, {
                model: options.model,
                messages: options.tools ? (0, toolParser_1.default)(options.messages, options.tools) : options.messages
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            response.data.choices = (0, toolParser_1.parseAssistantMessage)(response.data.choices[0].message.content, options.tools);
            return response.data;
        }
        catch (error) {
            console.error("Error generating completion:", error);
            return error;
        }
    }
    async getModels() {
        try {
            const response = await axios_1.default.get(`${this.apiEndpoint}/models`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const allModels = response.data.data.map((model) => ({
                ...model,
                provider: "Local Provider",
            }));
            return allModels;
        }
        catch (error) {
            console.error("Error fetching models:", error);
            return error;
        }
    }
}
exports.default = LMStudio;
