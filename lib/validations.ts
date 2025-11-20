import { z } from "zod"

// User validations
export const CreateUserSchema = z.object({
  name: z.string().min(2, "姓名至少2个字"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  role: z.enum(["SUPER_ADMIN", "TEACHER", "STUDENT"]),
  organizationId: z.string().uuid().optional(),
}).refine(
  (data) => {
    // TEACHER and STUDENT must have an organizationId
    if ((data.role === 'TEACHER' || data.role === 'STUDENT') && !data.organizationId) {
      return false
    }
    return true
  },
  {
    message: "教师和学生必须分配到组织",
    path: ["organizationId"]
  }
)

export const UpdateUserStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["ACTIVE", "BANNED", "PENDING"]),
})

// Organization validations
export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "组织名称至少2个字"),
  aiTokenLimit: z.coerce.number().min(1000, "Token限制至少1000"),
})

export const UpdateSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  aiSubStatus: z.enum(["ACTIVE", "EXPIRED", "INACTIVE"]),
  aiSubEndDate: z.date().optional(),
  aiTokenLimit: z.coerce.number().min(0),
})

// Course validations
export const CreateCourseSchema = z.object({
  name: z.string().min(2, "课程名称至少2个字"),
  description: z.string().optional(),
})

export const UpdateCourseSchema = z.object({
  name: z.string().min(2, "课程名称至少2个字").optional(),
  code: z.string().min(2, "课程代码至少2个字").optional(),
  description: z.string().optional(),
  archived: z.boolean().optional(),
})

// Assignment validations
export const CreateAssignmentSchema = z.object({
  title: z.string().min(2, "标题至少2个字"),
  description: z.string().min(10, "描述至少10个字"),
  deadline: z.date().refine((date) => date > new Date(), "截止时间必须在未来"),
  maxScore: z.coerce.number().min(1).max(100, "最高分数为100"),
  courseId: z.string().uuid(),
})

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(2, "标题至少2个字").optional(),
  description: z.string().min(10, "描述至少10个字").optional(),
  deadline: z.date().optional(),
  maxScore: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
})

// Submission validations
export const CreateSubmissionSchema = z.object({
  content: z.string().min(10, "内容至少10个字"),
  assignmentId: z.string().uuid(),
})

export const GradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100),
  teacherFeedback: z.string().optional(),
})

// CSV Import validation
export const ImportUsersSchema = z.array(
  z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["TEACHER", "STUDENT"]),
  })
)
