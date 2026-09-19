import React, { useEffect, useState } from 'react';
import styles from './Styles/Idea.module.scss';
import Button from '../Core/Button';
import { Blurhash } from "react-blurhash";
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import API from '../../common/api';
import FormSubmitLoading from '../../layouts/FormSubmitLoading/Loading';

const Idea = () => {
    const [showModal, setShowModal] = useState(false);
    // useEffect(()=>{
    //     console.log('date',date)
    // },[])

    // Toggle modal visibility
    const handleReadMore = () => {
        setShowModal(!showModal)
    };
    const [loading, setLoading] = useState(false);

    const stripHtml = (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    };


    const [imageLoaded, setImageLoaded] = useState(false);


    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm()

    const onSubmit = async (data) => {
        console.log("Form submitted:", data);
        setLoading(true);
        const response = await fetch(API.IdeaSubmission.url, {
            method: API.IdeaSubmission.method,
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            toast.success("Idea submitted successfully!");
            setShowModal(false);
            reset();
            setLoading(false);
        } else {
            toast.error("Failed to submit idea.");
            setLoading(false);
        }
    }

    return (
        <div className={styles.IdeaCard}>
            {/* <img src={image} alt={title} className={styles.IdeaCardImage} /> */}
            {/* <div className={styles.announcementSection}>
                Nominations for Distinguished Alumni Award 2025  <a href="https://nomination.iicnitdgp.in" target="_blank" rel="noopener noreferrer">here</a>
            </div> */}

            <div className={styles.IdeaCardContent}>
                <div>Do you have new ideas? We welcome innovative suggestions and creative thoughts that can help us build a brighter future together. Share your ideas, and let's make an impact!</div>

                <Button className={styles.readMoreBtn} onClick={handleReadMore} style={{
                    background: "var(--primary)",
                    border: "none",
                }}>Apply Now</Button>
            </div>

            {/* Modal for full Idea/blog content */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={handleReadMore}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.ideaFormContainer}>
                            <h1 className={styles.formTitle}>Idea <span style={{
                                background: "var(--primary)",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                            }}>Submission</span> Form</h1>
                            <form onSubmit={handleSubmit(onSubmit)} className={styles.ideaForm}>
                                <div className={styles.formGroup}>
                                    <label>Title of the Idea *</label>
                                    <input {...register("title", { required: true })} />
                                    {errors.title && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Summary of the Proposal (500 words) *</label>
                                    <textarea
                                        rows={6}
                                        {...register("summary", { required: true, maxLength: 3000 })}
                                    />
                                    {errors.summary && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Themes *</label>
                                    <select {...register("themes", { required: true })}>
                                        <option value="">Select a theme</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Education">Education</option>
                                        <option value="Environment">Environment</option>
                                        <option value="Energy">Energy</option>
                                        <option value="Agriculture">Agriculture</option>
                                        <option value="Smart Cities">Smart Cities</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Others">Others</option>
                                    </select>
                                    {errors.themes && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Innovation Type *</label>
                                    <select {...register("innovationType", { required: true })}>
                                        <option value="">Select innovation type</option>
                                        <option value="Product">Product</option>
                                        <option value="Process">Process</option>
                                        <option value="Service">Service</option>
                                        <option value="Market Place">Market Place</option>
                                        <option value="Business/Management Innovation">Business/Management Innovation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.innovationType && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Number of Team Members *</label>
                                    <input type="number" {...register("teamMembers", { required: true })} />
                                    {errors.teamMembers && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Name (Team Leader) *</label>
                                    <input {...register("teamLeaderName", { required: true })} />
                                    {errors.teamLeaderName && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Roll Number (Team Leader) *</label>
                                    <input {...register("teamLeaderRoll", { required: true })} />
                                    {errors.teamLeaderRoll && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Phone Number (Team Leader) *</label>
                                    <input type="tel" {...register("teamLeaderPhone", { required: true })} />
                                    {errors.teamLeaderPhone && <p className={styles.error}>This field is required</p>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>E-Mail (Team Leader) *</label>
                                    <input type="email" {...register("teamLeaderEmail", { required: true })} />
                                    {errors.teamLeaderEmail && <p className={styles.error}>This field is required</p>}
                                </div>

                                {loading ? <FormSubmitLoading /> : <button type="submit" className={styles.submitBtn} style={{
                                    background: "var(--primary)",
                                    // WebkitBackgroundClip: "text",
                                    // color: "transparent",
                                }}>Submit</button>}
                            </form>
                        </div>

                        <button className={styles.closeBtn} onClick={handleReadMore}>X</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Idea;

