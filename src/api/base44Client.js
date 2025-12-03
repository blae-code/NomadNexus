const API_URL = 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const createEntity = (name) => {
  const lowerCaseName = name.toLowerCase();
  return {
    list: async () => {
      const response = await fetch(`${API_URL}/api/${lowerCaseName}`, { headers: getHeaders() });
      return response.json();
    },
    get: async (id) => {
      const response = await fetch(`${API_URL}/api/${lowerCaseName}/${id}`, { headers: getHeaders() });
      return response.json();
    },
    create: async (data) => {
      const response = await fetch(`${API_URL}/api/${lowerCaseName}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    update: async (id, data) => {
      const response = await fetch(`${API_URL}/api/${lowerCaseName}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`${API_URL}/api/${lowerCaseName}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return response.json();
    }
  };
};

export const base44 = {
  auth: {
    login: async (callsign, password) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callsign, password })
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    },
    register: async (full_name, callsign, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, callsign, password })
        });
        return response.json();
    },
    me: async () => {
      const response = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
      return response.json();
    },
    updateMe: async (data) => {
      // This would require a /api/user/me endpoint or similar
      console.warn('auth.updateMe is not implemented');
      return data;
    }
  },
  entities: {
    Event: createEntity('Event'),
    Squad: createEntity('Squad'),
    SquadMember: createEntity('SquadMember'),
    PlayerStatus: createEntity('PlayerStatus'),
    Channel: createEntity('Channel'),
    Message: createEntity('Message'),
    VoiceNet: createEntity('VoiceNet'),
    Coffer: createEntity('Coffer'),
    CofferTransaction: createEntity('CofferTransaction'),
    AIAgent: createEntity('AIAgent'),
    AIAgentLog: createEntity('AIAgentLog'),
    AIAgentRule: createEntity('AIAgentRule'),
    ArmoryItem: createEntity('ArmoryItem'),
    Role: createEntity('Role'),
    FleetAsset: createEntity('FleetAsset'),
    Mission: createEntity('Mission'),
    User: createEntity('User'),
    Skill: createEntity('Skill'), // Added Skill entity
    Certification: createEntity('Certification'), // Added Certification entity
    InstructionRequest: createEntity('InstructionRequest'), // Added InstructionRequest entity
    TrainingObjective: createEntity('TrainingObjective'), // Added TrainingObjective entity
    SessionProgress: createEntity('SessionProgress'), // Added SessionProgress entity
  },
  functions: {
    invoke: async (name, data) => {
      const response = await fetch(`${API_URL}/functions/${name}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    }
  },
  post: async (path, data) => { // Added generic POST method
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },
  integrations: {
    Core: {
        InvokeLLM: async (data) => {
            console.warn('integrations.Core.InvokeLLM is not implemented');
            return { result: "This is a mocked LLM response."};
        }
    }
  }
};

