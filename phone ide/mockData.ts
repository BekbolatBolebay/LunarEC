import { FileItem, EditorTab, TerminalSession, AiChatMessage } from './types';

export const initialFiles: FileItem[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'folder',
    childrenCount: 7,
    isOpen: true,
    children: [
      {
        id: 'src-api',
        name: 'api',
        path: 'src/api',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'src-api-controllers',
            name: 'controllers',
            path: 'src/api/controllers',
            type: 'folder',
            isOpen: true,
            children: [
              {
                id: 'server-ts',
                name: 'server.ts',
                path: 'src/api/controllers/server.ts',
                type: 'file',
                extension: 'ts',
                status: 'M',
                content: `import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from './middlewares/auth';
import { db } from '../database';

// Басты API қолданбасын инициализациялау
export const app = fastify({ logger: true });

app.post('/api/v1/deploy', async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Рұқсат берілмеген' });
    }
    const session = await verifyJWT(token);
    const clusterId = req.body.clusterTarget;
    const cluster = await db.nodes.findUnique({
      where: { id: clusterId, tenantId: session.tenantId }
    });
    await db.events.emit(clusterId);
    return reply.status(202).send({ status: 'node: cluster' });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ қателік: 'Серверде қате орын алды' });
  }
});`
              },
              {
                id: 'auth-controller-ts',
                name: 'auth.controller.ts',
                path: 'src/api/controllers/auth.controller.ts',
                type: 'file',
                extension: 'ts',
                status: 'checked',
                content: `import { FastifyRequest, FastifyReply } from 'fastify';
import { signJWT } from '../utils/jwt';

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const { email, password } = req.body as any;
  if (!email || !password) {
    return reply.status(400).send({ message: 'Email мен пароль міндетті' });
  }
  const token = await signJWT({ email });
  return reply.send({ token, success: true });
}`
              },
              {
                id: 'user-controller-ts',
                name: 'user.controller.ts',
                path: 'src/api/controllers/user.controller.ts',
                type: 'file',
                extension: 'ts',
                content: `import { FastifyRequest, FastifyReply } from 'fastify';

export async function getProfile(req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ id: 1, name: 'Bekbolat', role: 'Lead Architect' });
}`
              }
            ]
          },
          {
            id: 'src-api-middleware',
            name: 'middleware',
            path: 'src/api/middleware',
            type: 'folder',
            childrenCount: 2,
            isOpen: false,
            children: [
              {
                id: 'auth-ts',
                name: 'auth.ts',
                path: 'src/api/middleware/auth.ts',
                type: 'file',
                extension: 'ts'
              }
            ]
          },
          {
            id: 'src-api-routes',
            name: 'routes',
            path: 'src/api/routes',
            type: 'folder',
            childrenCount: 3,
            isOpen: false,
            children: [
              {
                id: 'index-routes-ts',
                name: 'index.ts',
                path: 'src/api/routes/index.ts',
                type: 'file',
                extension: 'ts'
              }
            ]
          }
        ]
      },
      {
        id: 'src-config',
        name: 'config',
        path: 'src/config',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'database-ts',
            name: 'database.ts',
            path: 'src/config/database.ts',
            type: 'file',
            extension: 'ts',
            content: `export const db = {
  nodes: {
    findUnique: async (args: any) => ({ id: args.where.id, ready: true })
  },
  events: {
    emit: async (name: string) => console.log('Event emitted:', name)
  }
};`
          },
          {
            id: 'env-ts',
            name: 'env.ts',
            path: 'src/config/env.ts',
            type: 'file',
            extension: 'ts',
            content: `export const env = {
  PORT: process.env.PORT || 8080,
  SECRET: process.env.SECRET || 'secret_key'
};`
          }
        ]
      }
    ]
  },
  {
    id: 'package-json',
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    extension: 'json',
    status: 'M',
    content: `{
  "name": "nexflow-api",
  "version": "1.0.0",
  "main": "src/server.ts",
  "scripts": {
    "dev": "tsx watch src/server.ts"
  }
}`
  },
  {
    id: 'tsconfig-json',
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    type: 'file',
    extension: 'json'
  },
  {
    id: 'env-local',
    name: '.env.local',
    path: '.env.local',
    type: 'file',
    extension: 'env',
    status: 'U'
  },
  {
    id: 'readme-md',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    extension: 'md'
  }
];

export const initialTabs: EditorTab[] = [
  {
    id: 'server-ts',
    name: 'server.ts',
    path: 'src/api/controllers/server.ts',
    isDirty: true,
    language: 'typescript'
  },
  {
    id: 'auth-controller-ts',
    name: 'auth.controller.ts',
    path: 'src/api/controllers/auth.controller.ts',
    isDirty: false,
    language: 'typescript'
  },
  {
    id: 'database-ts',
    name: 'database.ts',
    path: 'src/config/database.ts',
    isDirty: false,
    language: 'typescript'
  }
];

export const initialTerminalSessions: TerminalSession[] = [
  {
    id: '1',
    title: '1: zsh (node)',
    logs: [
      {
        id: 'l1',
        type: 'info',
        text: 'CodeCraft v3.4.2 [arm64-linux]             POSIX tty1 • UTF-8'
      },
      {
        id: 'l2',
        type: 'cmd',
        text: 'developer@codecraft : ~/nexflow-api $ npm run dev'
      },
      {
        id: 'l3',
        type: 'info',
        text: '> nexflow-api@1.0.0 dev\n> tsx watch src/server.ts'
      },
      {
        id: 'l4',
        type: 'badge-success',
        text: 'Сервер қосылды: http://localhost:8080'
      },
      {
        id: 'l5',
        type: 'badge-db',
        text: 'PostgreSQL қосылымы белсенді • пул: 10 байланыс'
      },
      {
        id: 'l6',
        type: 'badge-warn',
        text: 'Redis кэш сұрауы орындалмады (Жад резервіне ауыстырылды)'
      },
      {
        id: 'l7',
        type: 'http',
        data: {
          method: 'GET',
          path: '/api/v1/health',
          status: '200 OK',
          time: '12ms',
          ip: '192.168.1.42'
        }
      },
      {
        id: 'l8',
        type: 'http',
        data: {
          method: 'POST',
          path: '/api/v1/workflows/trigger',
          status: '201 Жасалды',
          time: '48ms'
        }
      },
      {
        id: 'l9',
        type: 'json',
        data: {
          title: 'Сұраныс деректері (Payload)',
          mime: 'application/json',
          content: {
            workflow_id: 'wf_sync_9934',
            автоматтандыру: true,
            деректер_көлемі: 1420
          }
        }
      },
      {
        id: 'l10',
        type: 'cmd',
        text: 'developer@codecraft : ~/nexflow-api $ git status'
      }
    ]
  },
  {
    id: '2',
    title: '2: npm run dev',
    logs: [
      {
        id: 'l2-1',
        type: 'cmd',
        text: 'developer@codecraft : ~/nexflow-api $ npm run build'
      },
      {
        id: 'l2-2',
        type: 'badge-success',
        text: 'Build successfully completed in 1.4s!'
      }
    ]
  },
  {
    id: '3',
    title: '3: docker-compose',
    logs: [
      {
        id: 'l3-1',
        type: 'cmd',
        text: 'docker-compose up -d'
      },
      {
        id: 'l3-2',
        type: 'badge-db',
        text: 'Container nexflow_postgres Started (Healthy)'
      }
    ]
  }
];

export const initialAiMessages: AiChatMessage[] = [
  {
    id: 'm1',
    sender: 'user',
    text: 'server.ts ішіндегі JWT тексеруін қалай қауіпсіз ете аламын? Token мерзімі өткенде нақты 401 қатесін қайтару керек.',
    timestamp: '11:42'
  },
  {
    id: 'm2',
    sender: 'ai',
    text: 'Сіздің verifyToken middleware функцияңызды жақсарту үшін мына өзгерісті ұсынамын. TokenExpiredError нақты ұсталып, клиентке дұрыс статус код жіберіледі:',
    timestamp: 'жаңа ғана',
    contextSnippet: {
      file: 'server.ts',
      lines: '14-22'
    },
    codeBlock: {
      fileName: 'server.ts',
      language: 'TypeScript',
      code: `export const verifyToken = (req, res, next) => {
  try {
    const auth = req.headers['authorization'];
    const token = auth?.split(' ')[1];
    req.user = jwt.verify(token, env.SECRET);
    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 'EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};`
    },
    highlights: [
      'TokenExpiredError арнайы ұстауы: Мерзімі өтіп кеткен токенді жалпы жарамсыз токеннен ажыратып, арнайы 401 Unauthorized және \'EXPIRED\' коды қайтарылады. Бұл клиентке рефреш-токен сұрауын жіберуге мүмкіндік береді.',
      'Қауіпсіз статус айырмашылығы: Басқа бұзылған немесе жалған қолтаңбалары бар токендерге нақты 403 Forbidden жауабы беріледі.'
    ],
    metrics: '184 tokens • 1.2s'
  }
];
