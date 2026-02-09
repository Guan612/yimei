const API_BASE_URL =
  (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
    .VITE_API_URL ||
  (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:8010";

// 后端统一返回格式
interface ApiResponse<T = any> {
  code: number; // 0: 成功, 1: 失败
  msg: string;
  data?: T;
}

type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = <T>(
  response: ApiResponse<T>,
) => ApiResponse<T> | Promise<ApiResponse<T>>;
type ErrorInterceptor = (error: any) => any;

interface RequestConfig extends RequestInit {
  url?: string;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  // 添加错误拦截器
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
    return this;
  }

  // 设置默认请求头
  setHeader(key: string, value: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      [key]: value,
    };
    return this;
  }

  // 移除请求头
  removeHeader(key: string) {
    const headers = { ...this.defaultHeaders };
    delete (headers as any)[key];
    this.defaultHeaders = headers;
    return this;
  }

  // 设置 Token
  setToken(token: string) {
    this.setHeader("Authorization", `Bearer ${token}`);
    return this;
  }

  // 清除 Token
  clearToken() {
    this.removeHeader("Authorization");
    return this;
  }

  // 构建 URL（包含查询参数）
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;

    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  // 执行请求拦截器
  private async executeRequestInterceptors(
    config: RequestConfig,
  ): Promise<RequestConfig> {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    return finalConfig;
  }

  // 执行响应拦截器
  private async executeResponseInterceptors<T>(
    response: ApiResponse<T>,
  ): Promise<ApiResponse<T>> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  // 执行错误拦截器
  private async executeErrorInterceptors(error: any): Promise<any> {
    let finalError = error;
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError);
    }
    return finalError;
  }

  // 核心请求方法
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // 执行请求拦截器
      const interceptedConfig = await this.executeRequestInterceptors(config);

      const {
        url = "",
        params,
        data,
        timeout,
        ...fetchOptions
      } = interceptedConfig;

      // 构建完整 URL
      const fullUrl = this.buildUrl(url, params);

      // 合并请求头
      const headers = {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      };

      // 处理请求体
      let body = fetchOptions.body;
      if (data && !body) {
        if (data instanceof FormData) {
          body = data;
          // FormData 不需要设置 Content-Type，浏览器会自动设置
          delete (headers as any)["Content-Type"];
        } else {
          body = JSON.stringify(data);
        }
      }

      // 创建请求配置
      const requestInit: RequestInit = {
        ...fetchOptions,
        headers,
        body,
      };

      // 发送请求（支持超时）
      const controller = new AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      const response = await fetch(fullUrl, {
        ...requestInit,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // 解析响应
      let responseData: any;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // 构建响应对象
      let apiResponse: ApiResponse<T>;

      if (!response.ok) {
        // HTTP 错误状态码，构造错误响应
        apiResponse = {
          code: 1,
          msg: responseData?.msg || responseData?.message || "请求失败",
          data: responseData?.data,
        };
      } else {
        // 后端返回的数据已经是 Result 格式 {code, msg, data}
        apiResponse = responseData;
      }

      // 执行响应拦截器
      return await this.executeResponseInterceptors(apiResponse);
    } catch (error) {
      // 执行错误拦截器
      const processedError = await this.executeErrorInterceptors(error);

      return {
        code: 1,
        msg:
          processedError instanceof Error ? processedError.message : "网络错误",
      };
    }
  }

  // 便捷方法：GET
  get<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">) {
    return this.request<T>({
      ...config,
      url,
      method: "GET",
    });
  }

  // 便捷方法：POST
  post<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method" | "data">,
  ) {
    return this.request<T>({
      ...config,
      url,
      method: "POST",
      data,
    });
  }

  // 便捷方法：PUT
  put<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method" | "data">,
  ) {
    return this.request<T>({
      ...config,
      url,
      method: "PUT",
      data,
    });
  }

  // 便捷方法：PATCH
  patch<T = any>(
    url: string,
    data?: any,
    config?: Omit<RequestConfig, "url" | "method" | "data">,
  ) {
    return this.request<T>({
      ...config,
      url,
      method: "PATCH",
      data,
    });
  }

  // 便捷方法：DELETE
  delete<T = any>(url: string, config?: Omit<RequestConfig, "url" | "method">) {
    return this.request<T>({
      ...config,
      url,
      method: "DELETE",
    });
  }
}

// 创建默认实例
const api = new ApiClient();

// 添加默认拦截器示例（可选）
api.addRequestInterceptor((config) => {
  // 从 localStorage 获取 token（与 tokenAtom 的 key "auth_token" 保持一致）
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // localStorage.getItem 返回的是字符串，如果存储的是 JSON，需要解析
      // atomWithStorage 默认会序列化，所以需要解析 JSON
      const parsedToken = token.startsWith('"') ? JSON.parse(token) : token;
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${parsedToken}`,
      };
    }
  }
  return config;
});

api.addResponseInterceptor((response) => {
  // 可以在这里统一处理响应
  return response;
});

api.addErrorInterceptor((error) => {
  // 可以在这里统一处理错误
  console.error("API Error:", error);
  return error;
});

// 导出实例和类
export { api, API_BASE_URL };
export type { ApiResponse, RequestConfig };
