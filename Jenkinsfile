// ================================================================
//  Jenkins CD — Frontend: React 19 + Vite
//  Job này được cấu hình trong Jenkins UI để CHỈ trigger khi có commit
//  mới trên nhánh main (sau khi PR đã pass CI và được merge)
//  Build → Deploy S3 → Invalidate CloudFront
// ================================================================

pipeline {
    agent any

    environment {
        AWS_REGION                 = 'ap-northeast-1'
        S3_BUCKET                  = 'thermal-power-plant-frontend-197826770971'
        CLOUDFRONT_DISTRIBUTION_ID = 'E20IYT0M2C12UD'
        FRONTEND_DIR               = 'm6-thermal-power-plant'
    }

    stages {
        stage('Install') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm ci'
                }
            }
        }

        stage('Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                    sh 'ls -lh dist/'
                }
            }
        }

        stage('Deploy to S3 + CloudFront') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh """
                        aws s3 sync dist/ s3://${S3_BUCKET}/ \
                            --delete \
                            --region ${AWS_REGION}
                    """

                    sh """
                        aws cloudfront create-invalidation \
                            --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
                            --paths '/*'
                    """
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Frontend deployed — https://ddvn9usdc5uus.cloudfront.net'
        }
        failure {
            echo '❌ Deploy thất bại! Xem log trên.'
        }
    }
}
