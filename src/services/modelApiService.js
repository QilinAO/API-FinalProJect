// ======================================================================
// File: src/services/modelApiService.js
// หน้าที่: จัดการการเรียกใช้ HuggingFace Model API สำหรับตรวจสอบประเภทปลากัด
// ======================================================================

const axios = require('axios');
// ใช้ Dynamic Import สำหรับ ES Module
let Client = null;

class ModelApiService {
  constructor() {
    this.timeout = 60000; // 60 วินาที (Gradio อาจใช้เวลานาน)
    this.huggingFaceToken = process.env.HUGGINGFACE_API_TOKEN;
    this.spaceId = process.env.HUGGINGFACE_SPACE_ID || 'QilinAO/betta-ts-space';

    // สร้าง Space URL จาก ENV ให้ถูกต้องเสมอ (รองรับทั้งลิงก์ huggingface.co/spaces และโดเมน .hf.space)
    const resolveSpaceUrl = () => {
      const raw = (process.env.HUGGINGFACE_SPACE_URL || '').trim();
      if (raw) {
        // รูปแบบ: https://huggingface.co/spaces/<owner>/<space>
        const m = raw.match(/\/spaces\/([^/]+)\/([^/?#]+)/i);
        if (m) {
          const sub = `${m[1]}-${m[2]}`.toLowerCase();
          return `https://${sub}.hf.space`;
        }
        // ถ้าให้โดเมน .hf.space มาแล้ว ใช้เลย
        if (/\.hf\.space\b/i.test(raw)) return raw.replace(/\/$/, '');
      }
      // ถ้ายังไม่มี URL ให้ derive จาก SPACE_ID (owner/space)
      if (this.spaceId && this.spaceId.includes('/')) {
        const sub = this.spaceId.replace('/', '-').toLowerCase();
        return `https://${sub}.hf.space`;
      }
      return 'https://qilinao-betta-ts-space.hf.space';
    };
    this.spaceUrl = resolveSpaceUrl();
    
    // 尊重环境变量：仅当显式为 'true' 时启用 Gradio；默认 false，避免本地误连外网
    this.useGradioAPI = process.env.USE_GRADIO_API === 'true';
    // 离线/本地短路标志：开启后不访问任何外部网络
    this.offlineMode = String(process.env.OFFLINE_AUTH || '').toLowerCase() === 'true';
    
    // URLs สำหรับ API ต่างๆ
    this.inferenceURL = 'https://api-inference.huggingface.co/models';
    this.gradioURL = `${this.spaceUrl}/gradio_api/call`;
    
    // Cache สำหรับ Space spec
    this.spaceSpec = null;
    this.gradioClient = null;
    
    if (!this.huggingFaceToken) {
      console.warn('⚠️ HUGGINGFACE_API_TOKEN not found in environment variables');
      console.warn('   Model API will work in limited mode');
    } else {
      console.log('🔑 HuggingFace API Token: ✅ Set');
    }
    // ถ้าไม่ได้เปิด Gradio และไม่มี Token ให้บังคับใช้โหมด offline เพื่อลด 502 ใน dev
    if (!this.useGradioAPI && !this.huggingFaceToken && !this.offlineMode) {
      this.offlineMode = true;
      console.log('🛠️  Auto-enabled OFFLINE mode (no Gradio and no token)');
    }
    
    console.log(`🤖 Model Configuration:`);
    console.log(`   📍 Space ID: ${this.spaceId}`);
    console.log(`   🌐 Space URL: ${this.spaceUrl}`);
    console.log(`   🔧 API Type: ${this.useGradioAPI ? 'Gradio Space' : 'Inference/Disabled'}`);
    if (this.offlineMode) {
      console.log('🛠️  OFFLINE_AUTH enabled: Model API calls will be mocked locally');
    }
  }

  /**
   * สร้าง headers สำหรับ HuggingFace API
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.huggingFaceToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 返回本地离线的模拟结果（不访问网络）
   */
  buildOfflineMockResult() {
    // 返回一个低置信度、提示“其它/不确定”的结果，结构与前端预期一致
    const formattedData = {
      top1: { prob: 0.0 },
      final_label: {
        code: 'OTHER',
        name: 'อื่นๆ / ไม่แน่ใจ',
        reason: 'OFFLINE 模式：未调用外部模型，无法确定类型'
      },
      is_confident: false,
      topk: []
    };
    return { success: true, data: formattedData };
  }

  /**
   * ดึงสเปกของ Space และหา predict endpoint
   */
  async getSpaceSpec() {
    if (this.offlineMode) {
      throw new Error('Offline mode - no Space spec');
    }
    if (this.spaceSpec) {
      return this.spaceSpec; // ใช้ cache
    }

    try {
      console.log('🔍 กำลังดึงสเปกของ Space...');
      
      // สร้าง Gradio client - ใช้ Dynamic Import
      if (!Client) {
        const { Client: GradioClient } = await import('@gradio/client');
        Client = GradioClient;
      }
      this.gradioClient = await Client.connect(this.spaceUrl);
      
      // ดึง API info
      const apiInfo = this.gradioClient.config;
      
      console.log('✅ ดึงสเปก Space สำเร็จ');
      console.log('📊 Space Dependencies:', apiInfo.dependencies?.length || 0);
      
      // หา predict endpoint
      let predictEndpoint = null;
      if (apiInfo.dependencies) {
        for (const dep of apiInfo.dependencies) {
          if (dep.api_name === 'predict' || dep.api_name === '/predict') {
            predictEndpoint = dep;
            break;
          }
          // ถ้าไม่มี api_name แต่มี targets ที่เป็น submit button
          if (!predictEndpoint && dep.targets && dep.targets.some(t => t[1] === 'click')) {
            predictEndpoint = dep;
          }
        }
      }
      
      if (predictEndpoint) {
        console.log(`✅ พบ predict endpoint: ${predictEndpoint.api_name || 'unnamed'}`);
        console.log(`📊 Input components: ${predictEndpoint.inputs?.length || 0}`);
        console.log(`📊 Output components: ${predictEndpoint.outputs?.length || 0}`);
      } else {
        console.warn('⚠️ ไม่พบ predict endpoint ในสเปก');
      }
      
      this.spaceSpec = {
        config: apiInfo,
        predictEndpoint: predictEndpoint
      };
      
      return this.spaceSpec;
      
    } catch (error) {
      console.error('❌ ไม่สามารถดึงสเปก Space ได้:', error.message);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่า Space พร้อมใช้งานหรือไม่
   */
  async checkModelStatus() {
    try {
      if (this.offlineMode) return false;
      if (this.useGradioAPI) {
        const response = await axios.get(this.spaceUrl, { timeout: 10000 });
        return response.status === 200;
      } else {
        const response = await axios.get(`${this.inferenceURL}/${this.spaceId}`, {
          headers: this.getHeaders(),
          timeout: 5000
        });
        return response.status === 200;
      }
    } catch (error) {
      console.error('Model/Space status check failed:', error.message);
      return false;
    }
  }

  /**
   * ตรวจสอบประเภทปลากัดจากรูปภาพ
   * @param {Buffer} imageBuffer - รูปภาพในรูปแบบ Buffer
   * @param {number} threshold - ความเชื่อมั่นขั้นต่ำ (default: 0.90)
   * @returns {Promise<Object>} ผลการตรวจสอบ
   */
  async predictBettaType(imageBuffer, threshold = 0.90) {
    if (this.offlineMode) {
      return this.buildOfflineMockResult();
    }
    if (this.useGradioAPI) {
      return await this.predictWithGradio(imageBuffer, threshold);
    } else {
      return await this.predictWithInference(imageBuffer, threshold);
    }
  }

  /**
   * ใช้ Gradio Space API ด้วย @gradio/client
   */
  async predictWithGradio(imageBuffer, threshold = 0.90) {
    try {
      if (this.offlineMode) {
        return this.buildOfflineMockResult();
      }
      // ดึงสเปกของ Space ก่อน
      const spec = await this.getSpaceSpec();
      
      if (!this.gradioClient) {
        throw new Error('Gradio client not initialized');
      }
      
      if (!spec.predictEndpoint) {
        throw new Error('No predict endpoint found in Space spec');
      }
      
      console.log('📡 กำลังส่งรูปภาพไปยัง Gradio Space...');
      
      // สร้าง Blob จาก imageBuffer (สำหรับ @gradio/client)
      const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
      
      // เรียกใช้ predict ตาม api_name ที่พบในสเปก
      const apiName = spec.predictEndpoint.api_name || 'predict';
      
      console.log(`🎯 เรียกใช้ API: ${apiName}`);
      
      const result = await this.gradioClient.predict(apiName, [imageBlob]);
      
      console.log('✅ ได้รับผลลัพธ์จาก Gradio Space');
      
      // แปลงผลลัพธ์
      return this.formatGradioClientResult(result.data, threshold);
      
    } catch (error) {
      console.error('Gradio Client Error:', error.message);
      
      // Fallback: ลองใช้ axios แบบเดิม
      console.log('🔄 ลอง fallback ด้วย axios...');
      const fb = await this.predictWithGradioAxios(imageBuffer, threshold);
      if (!fb.success) {
        console.warn('Gradio fallback failed. Using offline mock result.');
        return this.buildOfflineMockResult();
      }
      return fb;
    }
  }

  /**
   * Fallback: ใช้ axios เรียก Gradio API แบบเดิม
   */
  async predictWithGradioAxios(imageBuffer, threshold = 0.90) {
    try {
      if (this.offlineMode) {
        return this.buildOfflineMockResult();
      }
      // แปลง Buffer เป็ง base64
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      
      // สร้าง session hash
      const sessionHash = Math.random().toString(36).substring(2);
      
      // Gradio API format
      const requestData = {
        data: [
          {
            path: null,
            url: base64Image,
            size: imageBuffer.length,
            orig_name: "betta_image.jpg",
            mime_type: "image/jpeg",
            is_stream: false,
            meta: { _type: "gradio.FileData" }
          }
        ],
        event_data: null,
        fn_index: 2, // predict function index
        trigger_id: 12, // submit button ID
        session_hash: sessionHash
      };

      const response = await axios.post(`${this.gradioURL}/predict`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        timeout: this.timeout
      });

      // ประมวลผล event stream response
      const result = await this.processGradioResponse(response.data, threshold);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get prediction from Gradio');
      }

      return result;
      
    } catch (error) {
      console.error('Gradio Axios Fallback Error:', error.message);
      // ใช้ offline mock เพื่อลด 502 บน frontend
      return this.buildOfflineMockResult();
    }
  }

  /**
   * ใช้ HuggingFace Inference API
   */
  async predictWithInference(imageBuffer, threshold = 0.90) {
    try {
      if (this.offlineMode) {
        return this.buildOfflineMockResult();
      }
      if (!this.huggingFaceToken) {
        // ไม่มี token → ใช้ offline mock เพื่อลด 502 ใน dev
        return this.buildOfflineMockResult();
      }

      const response = await axios.post(
        `${this.inferenceURL}/${this.spaceId}`, // ใช้ this.spaceId เนื่องจาก modelName อาจไม่มีหรือมีค่าเดียวกัน
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'image/jpeg'
          },
          timeout: this.timeout
        }
      );

      // แปลงผลลัพธ์จาก HuggingFace ให้เข้ากับรูปแบบเดิม
      const predictions = response.data;
      if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error('Invalid response from HuggingFace model');
      }

      return this.formatPredictionResult(predictions, threshold);
      
    } catch (error) {
      console.error('HuggingFace Inference API Error:', error.message);
      // ป้องกัน 502: คืน offline mock
      return this.buildOfflineMockResult();
    }
  }

  /**
   * ประมวลผล Gradio response
   */
  async processGradioResponse(responseData, threshold = 0.90) {
    try {
      if (typeof responseData === 'string') {
        const lines = responseData.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.msg === 'process_completed' && data.output?.data) {
                return this.formatGradioResult(data.output.data, threshold);
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      
      throw new Error('No valid result found in Gradio response');
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * แปลงผลลัพธ์จาก @gradio/client ให้ตรงกับรูปแบบที่ Frontend คาดหวัง
   */
  formatGradioClientResult(clientData, threshold = 0.90) {
    try {
      console.log('🔍 กำลังแปลงผลลัพธ์จาก Gradio Client:', JSON.stringify(clientData, null, 2));
      
      if (Array.isArray(clientData) && clientData.length >= 2) {
        const prediction = clientData[0]; // ผลทำนาย
        const probabilities = clientData[1]; // ความน่าจะเป็น
        
        if (probabilities && typeof probabilities === 'object') {
          // หา top prediction
          const topEntry = Object.entries(probabilities).reduce((a, b) => 
            a[1] > b[1] ? a : b
          );
          
          const bettaInfo = this.getBettaTypeInfo(topEntry[0]);
          const confidence = topEntry[1];
          const isConfident = confidence >= threshold; // ใช้ threshold จากพารามิเตอร์
          
          // รูปแบบที่ Frontend คาดหวัง
          const formattedData = {
            // สำหรับ BettaEvaluationForm
            top1: {
              prob: confidence
            },
            final_label: {
              code: bettaInfo.code,
              name: bettaInfo.name,
              reason: `AI วิเคราะห์จากลักษณะภาพพบว่าเป็นปลากัดพันธุ์${bettaInfo.name} ด้วยความมั่นใจ ${(confidence * 100).toFixed(1)}%`
            },
            is_confident: isConfident,
            topk: Object.entries(probabilities)
              .sort((a, b) => b[1] - a[1])
              .map(([label, score]) => {
                const info = this.getBettaTypeInfo(label);
                return {
                  label,
                  score,
                  code: info.code,
                  name: info.name
                };
              }),
            
            // สำหรับ SubmissionFormModal (backward compatibility)
            predictions: Object.entries(probabilities).map(([label, score]) => ({
              label,
              score,
              code: this.extractBettaTypeFromLabel(label)
            }))
          };

          return {
            success: true,
            data: formattedData
          };
        }
      }
      
      throw new Error('Invalid Gradio Client result format');
    } catch (error) {
      console.error('Error formatting Gradio Client result:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * แปลงผลลัพธ์จาก Gradio (axios fallback)
   */
  formatGradioResult(gradioData, threshold = 0.90) {
    try {
      if (Array.isArray(gradioData) && gradioData.length >= 2) {
        const prediction = gradioData[0]; // ผลทำนาย
        const probabilities = gradioData[1]; // ความน่าจะเป็น
        
        if (probabilities && typeof probabilities === 'object') {
          // หา top prediction
          const topEntry = Object.entries(probabilities).reduce((a, b) => 
            a[1] > b[1] ? a : b
          );
          const confidence = topEntry[1];
          const isConfident = confidence >= threshold;
          
          const formattedData = {
            final_label: {
              code: this.extractBettaTypeFromLabel(topEntry[0]),
              confidence: confidence,
              label: topEntry[0]
            },
            top1: {
              prob: confidence,
              label: topEntry[0]
            },
            is_confident: isConfident,
            predictions: Object.entries(probabilities).map(([label, score]) => ({
              label,
              score,
              code: this.extractBettaTypeFromLabel(label)
            }))
          };

          return {
            success: true,
            data: formattedData
          };
        }
      }
      
      throw new Error('Invalid Gradio result format');
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * แปลงผลลัพธ์จาก Inference API
   */
  formatPredictionResult(predictions, threshold = 0.90) {
    const topPrediction = predictions.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    const isConfident = (topPrediction?.score || 0) >= threshold;

    const formattedData = {
      final_label: {
        code: this.extractBettaTypeFromLabel(topPrediction.label),
        confidence: topPrediction.score,
        label: topPrediction.label
      },
      top1: {
        prob: topPrediction.score,
        label: topPrediction.label
      },
      is_confident: isConfident,
      predictions: predictions.slice(0, 3).map(pred => ({
        label: pred.label,
        score: pred.score,
        code: this.extractBettaTypeFromLabel(pred.label)
      }))
    };

    return {
      success: true,
      data: formattedData
    };
  }

  /**
   * แยกประเภทปลากัด (A, B, C, D, E, F, G, H) จาก label ของ HuggingFace model
   * @param {string} label - label จาก HuggingFace model QilinAO/betta-ts-space
   * @returns {string} ประเภทปลากัด
   */
  /**
   * แปลงจาก region label เป็น betta type พร้อมชื่อไทย
   */
  getBettaTypeInfo(label) {
    if (!label) return { code: 'UNKNOWN', name: 'ไม่ทราบ' };
    
    // สำหรับโมเดลนี้ที่จำแนก isaan / mahachai / south
    // ตาม bettaTypes.js: A=กลาง/เหนือ, B=อีสาน, C=ใต้, D=มหาชัย
    const regionMapping = {
      'isaan': { code: 'B', name: 'ปลากัดพื้นบ้านภาคอีสาน' },
      'mahachai': { code: 'D', name: 'ปลากัดพื้นบ้านมหาชัย' }, 
      'south': { code: 'C', name: 'ปลากัดพื้นภาคใต้' }
    };
    
    const lowerLabel = label.toLowerCase();
    for (const [region, info] of Object.entries(regionMapping)) {
      if (lowerLabel.includes(region)) {
        return info;
      }
    }
    
    // ถ้าไม่ใช่ region model ลองรูปแบบอื่น
    const patterns = [
      /\b([A-H])\b/i,           // "A", "B", "C" ที่เป็นคำแยก
      /type[_\s]*([A-H])/i,     // "Type_A", "type A", "typeB"
      /class[_\s]*([A-H])/i,    // "Class_A", "class A"
      /label[_\s]*([A-H])/i,    // "Label_A", "label A"
      /betta[_\s]*([A-H])/i,    // "Betta_A", "betta A"
      /([A-H])$/i,              // ลงท้ายด้วย A-H
      /^([A-H])/i,              // ขึ้นต้นด้วย A-H
    ];
    
    for (const pattern of patterns) {
      const match = label.match(pattern);
      if (match) {
        const code = match[1].toUpperCase();
        return { code, name: `ประเภท ${code}` };
      }
    }
    
    // หากไม่พบรูปแบบใดๆ ลอง log เพื่อ debug
    console.warn(`Unable to extract betta type from label: "${label}"`);
    return { code: 'UNKNOWN', name: 'ไม่ทราบ' };
  }

  // Backward compatibility
  extractBettaTypeFromLabel(label) {
    return this.getBettaTypeInfo(label).code;
  }

  /**
   * ตรวจสอบประเภทปลากัดจากหลายรูปภาพ
   * @param {Array<Buffer>} imageBuffers - รูปภาพหลายรูปในรูปแบบ Buffer
   * @param {number} threshold - ความเชื่อมั่นขั้นต่ำ (default: 0.90)
   * @returns {Promise<Object>} ผลการตรวจสอบ
   */
  async predictBettaTypeBatch(imageBuffers, threshold = 0.90) {
    try {
      if (!this.huggingFaceToken) {
        throw new Error('HuggingFace API token is required');
      }

      // HuggingFace Inference API ไม่รองรับ batch processing โดยตรง
      // ดังนั้นเราจะประมวลผลแต่ละรูปแล้วรวมผลลัพธ์
      const batchResults = await Promise.all(
        imageBuffers.map(async (buffer, index) => {
          try {
            const result = await this.predictBettaType(buffer, threshold);
            return {
              index,
              success: result.success,
              data: result.data,
              error: result.error
            };
          } catch (error) {
            return {
              index,
              success: false,
              error: error.message
            };
          }
        })
      );

      // รวมผลลัพธ์และคำนวณค่าเฉลี่ย
      const successfulResults = batchResults.filter(r => r.success);
      
      if (successfulResults.length === 0) {
        return {
          success: false,
          error: 'ไม่สามารถประมวลผลรูปภาพใดๆ ได้'
        };
      }

      // หาประเภทที่พบบ่อยที่สุด
      const typeVotes = {};
      successfulResults.forEach(result => {
        const type = result.data.final_label.code;
        typeVotes[type] = (typeVotes[type] || 0) + result.data.final_label.confidence;
      });

      const mostVotedType = Object.keys(typeVotes).reduce((a, b) => 
        typeVotes[a] > typeVotes[b] ? a : b
      );

      // สร้างผลลัพธ์รวม
      const averageConfidence = successfulResults.reduce((sum, result) => 
        sum + result.data.final_label.confidence, 0
      ) / successfulResults.length;

      const batchData = {
        batch_results: batchResults,
        consensus: {
          predicted_type: mostVotedType,
          confidence: averageConfidence,
          votes: typeVotes
        },
        processed_images: imageBuffers.length,
        successful_images: successfulResults.length
      };

      return {
        success: true,
        data: batchData
      };
    } catch (error) {
      console.error('HuggingFace Model API Batch Error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * ตรวจสอบว่าโมเดล API พร้อมใช้งานหรือไม่
   * @returns {Promise<boolean>}
   */
  async isModelReady() {
    try {
      if (this.offlineMode) return false;
      if (!this.huggingFaceToken) {
        return false;
      }
      return await this.checkModelStatus();
    } catch (error) {
      console.error('HuggingFace Model API Health Check Error:', error.message);
      return false;
    }
  }

  /**
   * ดึงข้อมูล taxonomy ของโมเดล (สำหรับ HuggingFace)
   * @returns {Promise<Object>}
   */
  async getModelTaxonomy() {
    try {
      if (!this.huggingFaceToken) {
        throw new Error('HuggingFace API token is required');
      }

      // HuggingFace ไม่มี endpoint สำหรับ taxonomy โดยตรง
      // เราจะ return ข้อมูล metadata พื้นฐาน
      const modelInfo = await axios.get(`https://huggingface.co/api/models/${this.spaceId}`, { // ใช้ this.spaceId เนื่องจาก modelName อาจไม่มีหรือมีค่าเดียวกัน
        timeout: 5000
      });

      // สร้าง taxonomy จำลองตามโครงสร้างเดิม
      const taxonomy = {
        classes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        model_info: {
          name: this.spaceId, // ใช้ this.spaceId เนื่องจาก modelName อาจไม่มีหรือมีค่าเดียวกัน
          pipeline_tag: modelInfo.data.pipeline_tag || 'image-classification',
          library_name: modelInfo.data.library_name || 'transformers'
        }
      };

      return {
        success: true,
        data: { taxonomy }
      };
    } catch (error) {
      console.error('HuggingFace Model Taxonomy Error:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * ตรวจสอบความสอดคล้องของประเภทปลากัด (ไม่เปลี่ยนแปลง - ใช้ได้กับทุกโมเดล)
   * @param {string} userSelectedType - ประเภทที่ผู้ใช้เลือก (A, B, C, D, E, F, G, H)
   * @param {Array<string>} allowedTypes - ประเภทที่การประกวดอนุญาต
   * @param {string} aiPredictedType - ประเภทที่ AI ตรวจพบ
   * @param {number} confidence - ความเชื่อมั่นของ AI (0-1)
   * @returns {Object} ผลการตรวจสอบ
   */
  validateBettaType(userSelectedType, allowedTypes, aiPredictedType, confidence = 0) {
    const isUserTypeAllowed = allowedTypes.includes(userSelectedType);
    const isAiTypeAllowed = allowedTypes.includes(aiPredictedType);
    const isAiConfident = confidence >= 0.90;
    const isTypeMatch = userSelectedType === aiPredictedType;

    let warning = null;
    let severity = 'info';

    // กรณีที่ AI ไม่มั่นใจ
    if (!isAiConfident) {
      warning = {
        message: 'AI ไม่สามารถระบุประเภทปลากัดได้อย่างชัดเจน (ความเชื่อมั่นต่ำ)',
        severity: 'warning',
        type: 'low_confidence'
      };
    }
    // กรณีที่ประเภทที่ผู้ใช้เลือกไม่ตรงกับที่ AI ตรวจพบ
    else if (!isTypeMatch) {
      warning = {
        message: `AI ตรวจพบว่าเป็นปลากัดประเภท "${aiPredictedType}" แต่คุณเลือกประเภท "${userSelectedType}"`,
        severity: 'warning',
        type: 'type_mismatch',
        aiPrediction: aiPredictedType,
        userSelection: userSelectedType
      };
    }
    // กรณีที่ AI ตรวจพบประเภทที่ไม่ได้รับอนุญาต
    else if (!isAiTypeAllowed) {
      warning = {
        message: `AI ตรวจพบว่าเป็นปลากัดประเภท "${aiPredictedType}" ซึ่งไม่ได้รับอนุญาตในการประกวดนี้`,
        severity: 'error',
        type: 'unauthorized_type',
        aiPrediction: aiPredictedType
      };
    }

    return {
      isValid: isUserTypeAllowed && (isAiConfident ? isAiTypeAllowed : true),
      isUserTypeAllowed,
      isAiTypeAllowed,
      isAiConfident,
      isTypeMatch,
      warning,
      confidence,
      userSelectedType,
      aiPredictedType
    };
  }
}

module.exports = new ModelApiService();
